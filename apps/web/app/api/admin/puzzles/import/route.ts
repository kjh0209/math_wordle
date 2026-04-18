/**
 * POST /api/admin/puzzles/import
 *
 * Accept a JSON array of puzzles conforming to the finalized spec,
 * validate each, insert valid ones into Supabase, return a summary.
 */

import { NextResponse } from "next/server";
import { validatePuzzleArray } from "@/lib/puzzles/spec-validator";
import { normalizePuzzle } from "@/lib/puzzles/puzzle-normalizer";
import {
  upsertManyPuzzles,
  createImportJob,
  finalizeImportJob,
} from "@/lib/puzzles/puzzle-repository";
import type { PuzzleRawPayload } from "@mathdle/core";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const puzzleArray: unknown[] = Array.isArray(body) ? body : [body];
  const { id: jobId } = await createImportJob("api-import", puzzleArray);

  // Validate each puzzle
  const results = validatePuzzleArray(puzzleArray);
  const valid: PuzzleRawPayload[] = [];
  const invalidItems: Array<{ id: string | null; errors: string[] }> = [];

  for (const { index, id, result } of results) {
    if (result.ok) {
      valid.push(puzzleArray[index] as PuzzleRawPayload);
    } else {
      invalidItems.push({ id, errors: result.errors.map((e) => `[${e.field}] ${e.message}`) });
    }
  }

  // Upsert valid puzzles
  const rows = valid.map((raw) => normalizePuzzle(raw, { sourceType: "imported-json" }));
  const upsertResults = await upsertManyPuzzles(rows);

  const insertErrors = upsertResults.filter((r) => r.error !== null);
  const importedCount = upsertResults.filter((r) => r.error === null).length;

  await finalizeImportJob(
    jobId,
    importedCount,
    invalidItems.length + insertErrors.length,
    [...invalidItems, ...insertErrors.map((e) => ({ id: e.id, error: e.error }))]
  );

  return NextResponse.json({
    jobId,
    total: puzzleArray.length,
    imported: importedCount,
    failed: invalidItems.length + insertErrors.length,
    validationErrors: invalidItems,
    insertErrors: insertErrors.map((e) => ({ id: e.id, error: e.error })),
  });
}
