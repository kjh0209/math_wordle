import { NextResponse } from "next/server";
import { getPuzzleById } from "@/lib/puzzles/puzzle-repository";
import {
  compareGuessCells,
  validateGuessCells,
  validateCellCount,
  validateAllowedCells,
  evaluateCellEquality,
  mapPuzzleDbRowToDomain,
  mapProblemSetPuzzleToViewModel,
  getProblemSetPuzzleById,
  extractValidationContext,
  isFeedbackSolved,
} from "@mathdle/core";
import type { PuzzleCell } from "@mathdle/core";
import type { ValidateGuessRequest, ValidateGuessResponse } from "@/types/api";

/**
 * POST /api/runs/[runId]/submit-guess
 *
 * Validates a guess within a step run context.
 * Resolves the puzzle from the Supabase DB first, then falls back to
 * the problem-set JSON (for step puzzles with IDs like "9_6_1").
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

  // ── Try DB puzzle first ──────────────────────────────────────────────────────
  const dbRow = await getPuzzleById(puzzleId);

  if (dbRow) {
    const domain = mapPuzzleDbRowToDomain(dbRow);
    const validation = validateGuessCells(guessCells, domain);

    if (!validation.ok) {
      return NextResponse.json<ValidateGuessResponse>({
        ok: false, feedback: [], solved: false, gameOver: false,
        message: validation.message,
      });
    }

    const feedback = compareGuessCells(guessCells, domain.answer.cells);
    const solved = isFeedbackSolved(feedback);
    const maxAttempts = domain.rules.maxAttempts;
    const gameOver = !solved && attemptNumber >= maxAttempts;

    return NextResponse.json<ValidateGuessResponse>({ ok: true, feedback, solved, gameOver });
  }

  // ── Fall back to problem-set puzzle ─────────────────────────────────────────
  const problemPuzzle = getProblemSetPuzzleById(puzzleId);
  if (!problemPuzzle) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  const vm = mapProblemSetPuzzleToViewModel(problemPuzzle);
  const ctx = extractValidationContext(vm);

  const countCheck = validateCellCount(guessCells, vm.answerLength);
  if (!countCheck.ok) {
    return NextResponse.json<ValidateGuessResponse>({
      ok: false, feedback: [], solved: false, gameOver: false,
      message: countCheck.message,
    });
  }

  const allowedCheck = validateAllowedCells(guessCells, ctx.shownTokens, ctx.shownBlocks);
  if (!allowedCheck.ok) {
    return NextResponse.json<ValidateGuessResponse>({
      ok: false, feedback: [], solved: false, gameOver: false,
      message: allowedCheck.message,
    });
  }

  const eqCheck = evaluateCellEquality(guessCells as PuzzleCell[], ctx.variableValue);
  if (!eqCheck.ok) {
    return NextResponse.json<ValidateGuessResponse>({
      ok: false, feedback: [], solved: false, gameOver: false,
      message: eqCheck.message,
    });
  }

  const feedback = compareGuessCells(guessCells as PuzzleCell[], ctx.answerCells as PuzzleCell[]);
  const solved = isFeedbackSolved(feedback);
  const maxAttempts = (problemPuzzle.rules as { maxAttempts?: number }).maxAttempts ?? 6;
  const gameOver = !solved && attemptNumber >= maxAttempts;

  return NextResponse.json<ValidateGuessResponse>({ ok: true, feedback, solved, gameOver });
}
