/**
 * POST /api/validate-guess
 *
 * Accepts the user's InputCell[] guess, validates it server-side, and returns
 * Wordle-style feedback.  The puzzle answer never leaves the server.
 *
 * Response errorKind distinguishes:
 *   "syntax" — structurally malformed expression
 *   "eval"   — valid expression but equation doesn't balance
 */

import { NextResponse } from "next/server";
import { getPuzzleById } from "@/lib/puzzles/puzzle-repository";
import { adaptPuzzle } from "@/lib/puzzles/puzzle-adapter";
import { validateInputCells, compareGuess } from "@/lib/game/validator";
import type { ValidateGuessRequest, ValidateGuessResponse } from "@/types/api";
import type { InputCell } from "@/types/puzzle";

export async function POST(req: Request) {
  let body: ValidateGuessRequest;
  try {
    body = (await req.json()) as ValidateGuessRequest;
  } catch {
    return NextResponse.json<ValidateGuessResponse>(
      { ok: false, feedback: [], solved: false, gameOver: false, message: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }

  const { puzzleId, cells, sessionKey, attemptNumber } = body;

  if (!puzzleId || !cells || !sessionKey) {
    return NextResponse.json<ValidateGuessResponse>(
      { ok: false, feedback: [], solved: false, gameOver: false, message: "필수 파라미터가 누락되었습니다." },
      { status: 400 }
    );
  }

  try {
    const transport = await getPuzzleById(puzzleId);
    if (!transport) {
      return NextResponse.json(
        { ok: false, feedback: [], solved: false, gameOver: false, message: "퍼즐을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const vm = adaptPuzzle(transport);

    // Variable bindings from puzzle meta (e.g. { x: 3 })
    const scope = (vm.meta.variables as Record<string, number>) ?? {};

    // Phase 1 + 2: parse syntax, then evaluate equation
    const validation = validateInputCells(cells, scope);
    if (!validation.ok) {
      return NextResponse.json<ValidateGuessResponse>({
        ok: false,
        feedback: [],
        solved: false,
        gameOver: false,
        message: validation.message,
        errorKind: validation.errorKind,
      });
    }

    // Retrieve answer cells from puzzle meta
    const answerCells = vm.meta.answerCells as InputCell[] | undefined;
    if (!answerCells) {
      console.error("[POST /api/validate-guess] answerCells missing in puzzle meta", puzzleId);
      return NextResponse.json(
        { ok: false, feedback: [], solved: false, gameOver: false, message: "서버 설정 오류입니다." },
        { status: 500 }
      );
    }

    // Wordle-style comparison
    const feedback = compareGuess(cells, answerCells);
    const solved = feedback.every((f) => f === "correct");
    const gameOver = solved || attemptNumber >= vm.maxAttempts;

    return NextResponse.json<ValidateGuessResponse>({
      ok: true,
      feedback,
      solved,
      gameOver,
    });
  } catch (err) {
    console.error("[POST /api/validate-guess]", err);
    return NextResponse.json(
      { ok: false, feedback: [], solved: false, gameOver: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
