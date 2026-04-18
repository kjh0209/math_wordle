/**
 * scripts/import-puzzles.ts
 *
 * Seed / import puzzle JSON files that conform to the finalized mathle spec.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/import-puzzles.ts <file.json>
 *   npx ts-node --project tsconfig.scripts.json scripts/import-puzzles.ts  # uses example.json
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { validatePuzzleSpec, validatePuzzleArray } from "../lib/puzzles/spec-validator";
import { normalizePuzzle } from "../lib/puzzles/puzzle-normalizer";
import type { PuzzleRawPayload } from "@mathdle/core";

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Load source file ─────────────────────────────────────────────────────────

const sourceFile =
  process.argv[2] ?? path.resolve(process.cwd(), "../../example (2).json");

if (!fs.existsSync(sourceFile)) {
  console.error(`File not found: ${sourceFile}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(sourceFile, "utf-8")) as unknown;
const puzzleArray: unknown[] = Array.isArray(raw) ? raw : [raw];

console.log(`\nImporting ${puzzleArray.length} puzzle(s) from: ${sourceFile}\n`);

// ─── Validate ─────────────────────────────────────────────────────────────────

const validationResults = validatePuzzleArray(puzzleArray);
const valid: PuzzleRawPayload[] = [];
const failed: Array<{ id: string | null; errors: string[] }> = [];

for (const { index, id, result } of validationResults) {
  if (result.ok) {
    valid.push(puzzleArray[index] as PuzzleRawPayload);
  } else {
    failed.push({
      id,
      errors: result.errors.map((e) => `  [${e.field}] ${e.message}`),
    });
    console.warn(`  ✗ Puzzle ${id ?? `[${index}]`} failed validation:`);
    result.errors.forEach((e) => console.warn(`      [${e.field}] ${e.message}`));
  }
}

console.log(`  ✓ ${valid.length} valid, ✗ ${failed.length} invalid\n`);

if (valid.length === 0) {
  console.error("No valid puzzles to import. Aborting.");
  process.exit(1);
}

// ─── Create import job record ─────────────────────────────────────────────────

const { data: jobData } = await supabase
  .from("puzzle_import_jobs")
  .insert({
    source_name: path.basename(sourceFile),
    status: "pending",
    raw_payload: puzzleArray,
  })
  .select("id")
  .single();

const jobId = (jobData as { id: string } | null)?.id ?? "no-job";

// ─── Insert / upsert ──────────────────────────────────────────────────────────

let importedCount = 0;
const errorLog: Array<{ id: string; error: string }> = [];

for (const rawPuzzle of valid) {
  const row = normalizePuzzle(rawPuzzle, { sourceType: "imported-json" });

  const { error } = await supabase
    .from("puzzles")
    .upsert(row, { onConflict: "id" });

  if (error) {
    console.error(`  ✗ Failed to insert ${rawPuzzle.id}: ${error.message}`);
    errorLog.push({ id: rawPuzzle.id, error: error.message });
  } else {
    console.log(`  ✓ Inserted/updated: ${rawPuzzle.id} — ${rawPuzzle.title}`);
    importedCount++;
  }
}

// ─── Finalize import job ──────────────────────────────────────────────────────

const finalStatus = errorLog.length === 0 ? "success" : importedCount > 0 ? "success" : "failed";

await supabase.from("puzzle_import_jobs").update({
  status: finalStatus,
  imported_count: importedCount,
  failed_count: failed.length + errorLog.length,
  error_log: [...failed.map((f) => ({ id: f.id, errors: f.errors })), ...errorLog],
}).eq("id", jobId);

console.log(`\nDone. ${importedCount} imported, ${failed.length + errorLog.length} failed.`);

if (errorLog.length > 0 || failed.length > 0) {
  process.exit(1);
}
