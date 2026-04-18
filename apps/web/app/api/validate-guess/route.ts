/**
 * POST /api/validate-guess
 *
 * Cell-based server-side guess validation.
 * Receives PuzzleCell[] — never exposes the answer to the client.
 */

import { NextResponse } from "next/server";
import { getPuzzleById } from "@/lib/puzzles/puzzle-repository";
import { adaptPuzzle } from "@/lib/puzzles/puzzle-adapter";
import {
  validateCellCount,
  validateAllowedCells,
  evaluateCellEquality,
  compareGuessCells,
} from "@mathdle/core";
import type { PuzzleCell, ReservedBlock } from "@mathdle/core";

interface ValidateGuessRequest {
  puzzleId: string;
  guessCells: PuzzleCell[];
  sessionKey: string;
  attemptNumber: number;
  startTimeMs: number;
}

export async function POST(req: Request) {
  let body: ValidateGuessRequest;

  try {
    body = (await req.json()) as ValidateGuessRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { puzzleId, guessCells, sessionKey, attemptNumber } = body;

  if (!puzzleId || !Array.isArray(guessCells) || !sessionKey) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  try {
    const dbRow = await getPuzzleById(puzzleId);
    if (!dbRow) {
      return NextResponse.json({ error: "퍼즐을 찾을 수 없습니다." }, { status: 404 });
    }

    // Full view model with answer (server-side only)
    const vm = adaptPuzzle(dbRow, /* includeAnswer */ true);
    const answerCells = vm.meta.answerCells ?? [];

    // 1. Cell count
    const countCheck = validateCellCount(guessCells, vm.answerLength);
    if (!countCheck.ok) {
      return NextResponse.json({ ok: false, feedback: [], solved: false, gameOver: false, message: countCheck.message });
    }

    // 2. Allowed cells
    const allowedCheck = validateAllowedCells(
      guessCells,
      vm.shownTokens,
      vm.shownBlocks as ReservedBlock[]
    );
    if (!allowedCheck.ok) {
      return NextResponse.json({ ok: false, feedback: [], solved: false, gameOver: false, message: allowedCheck.message });
    }

    // 3. Equality check (best-effort, skips unsupported blocks)
    const variableValues = vm.meta.variableValue;
    const eqCheck = evaluateCellEquality(guessCells, variableValues);
    if (!eqCheck.ok) {
      return NextResponse.json({ ok: false, feedback: [], solved: false, gameOver: false, message: eqCheck.message });
    }

    // 4. Cell comparison (Wordle feedback)
    const feedback = compareGuessCells(guessCells, answerCells);
    const solved = feedback.every((f) => f === "correct");
    const gameOver = solved || attemptNumber >= vm.maxAttempts;

    return NextResponse.json({ ok: true, feedback, solved, gameOver });
  } catch (err) {
    console.error("[POST /api/validate-guess]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
