/**
 * POST /api/validate-guess
 *
 * Accepts the user's PuzzleCell array guess, validates it server-side against
 * the puzzle domain rules, and returns Wordle-style feedback.
 * The puzzle answer never leaves the server.
 */

import { NextResponse } from "next/server";
import {
  getMockPuzzleById,
  mapPuzzleDbRowToDomain,
  validateGuessCells,
  compareGuessCells,
} from "@mathdle/core";
import type { ValidateGuessRequest, ValidateGuessResponse } from "@/types/api";

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

  const { puzzleId, guessCells, sessionKey, attemptNumber } = body;

  if (!puzzleId || !guessCells || !sessionKey) {
    return NextResponse.json<ValidateGuessResponse>(
      { ok: false, feedback: [], solved: false, gameOver: false, message: "필수 파라미터가 누락되었습니다." },
      { status: 400 }
    );
  }

  try {
    // 1. Load puzzle raw data
    // TODO: Replace with real DB call when Supabase is integrated
    const dbRow = getMockPuzzleById(puzzleId);
    if (!dbRow) {
      return NextResponse.json(
        { ok: false, feedback: [], solved: false, gameOver: false, message: "퍼즐을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. Map to domain model
    const domainPuzzle = mapPuzzleDbRowToDomain(dbRow);

    // 3. Phase 1: Validate guess against puzzle constraints (length, allowed tokens, math equality)
    const validation = validateGuessCells(guessCells, domainPuzzle);
    if (!validation.ok) {
      return NextResponse.json<ValidateGuessResponse>({
        ok: false,
        feedback: [],
        solved: false,
        gameOver: false,
        message: validation.message,
      });
    }

    // 4. Phase 2: Compare guess to answer (Wordle style checking)
    const feedback = compareGuessCells(guessCells, domainPuzzle.answer.cells);
    const solved = feedback.every((f) => f === "correct");
    const gameOver = solved || attemptNumber >= domainPuzzle.rules.maxAttempts;

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
