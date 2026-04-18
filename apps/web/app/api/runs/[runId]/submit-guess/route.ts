import { NextResponse } from "next/server";
import { getPuzzleById } from "@/lib/puzzles/puzzle-repository";
import { adaptPuzzle } from "@/lib/puzzles/puzzle-adapter";
import { compareGuessCells, validateGuessCells, mapPuzzleDbRowToDomain, isFeedbackSolved } from "@mathdle/core";
import type { ValidateGuessRequest, ValidateGuessResponse } from "@/types/api";

/**
 * POST /api/runs/[runId]/submit-guess
 *
 * Validates a guess within a step run context.
 * The runId ties this guess to a specific step_attempt_runs record.
 * For now the puzzle is resolved from the request body (puzzleId),
 * but when Supabase is wired the run record itself carries the puzzleId.
 */
export async function POST(
  req: Request,
  { params }: { params: { runId: string } }
) {
  let body: ValidateGuessRequest & { puzzleId: string };
  try {
    body = (await req.json()) as ValidateGuessRequest & { puzzleId: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { guessCells, puzzleId, attemptNumber } = body;

  if (!puzzleId || !guessCells?.length) {
    return NextResponse.json({ error: "puzzleId and guessCells are required" }, { status: 400 });
  }

  const dbRow = await getPuzzleById(puzzleId);
  if (!dbRow) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  // Server-side validation with answer
  const domain = mapPuzzleDbRowToDomain(dbRow);
  const validation = validateGuessCells(guessCells, domain);

  if (!validation.ok) {
    return NextResponse.json<ValidateGuessResponse>({
      ok: false,
      feedback: [],
      solved: false,
      gameOver: false,
      message: validation.message,
    });
  }

  const answerCells = dbRow.raw_payload.answer.cells;
  const feedback = compareGuessCells(guessCells, answerCells);
  const solved = isFeedbackSolved(feedback);

  // gameOver if this attempt exhausts maxAttempts (rules.maxAttempts or default 6)
  const maxAttempts = domain.rules.maxAttempts;
  const gameOver = !solved && attemptNumber >= maxAttempts;

  return NextResponse.json<ValidateGuessResponse>({
    ok: true,
    feedback,
    solved,
    gameOver,
  });
}
