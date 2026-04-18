import { NextResponse } from "next/server";
import {
  getMockStepByCode,
  getMockPoolForStep,
  getMockPuzzleById,
  adaptPuzzle,
  selectPuzzleForStepRun,
} from "@mathdle/core";
import crypto from "crypto";
import type { StartRunRequest, StartRunResponse } from "@/types/api";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  let body: StartRunRequest;
  try {
    body = (await req.json()) as StartRunRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const step = getMockStepByCode(params.code);
  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  const pool = getMockPoolForStep(step.id);
  if (pool.length === 0) {
    return NextResponse.json({ error: "No puzzles configured for this step" }, { status: 500 });
  }

  // Pass progress if available. For mock testing, pass null.
  const selectedPoolEntry = selectPuzzleForStepRun(pool, null);
  if (!selectedPoolEntry) {
    return NextResponse.json({ error: "Could not select puzzle" }, { status: 500 });
  }

  const dbRow = getMockPuzzleById(selectedPoolEntry.puzzleId);
  if (!dbRow) {
    return NextResponse.json({ error: "Puzzle data missing" }, { status: 500 });
  }

  const puzzleViewModel = adaptPuzzle(dbRow, false);
  const runId = crypto.randomUUID();

  // Next: store the run in 'step_attempt_runs' linked to body.sessionKey.
  // For mock testing, we just return the run config.

  return NextResponse.json<StartRunResponse>({
    runId,
    puzzle: puzzleViewModel,
  });
}
