/**
 * POST /api/validate-guess
 *
 * Server-side guess validation. The answer stays server-side — clients
 * never receive the answer string.
 *
 * TODO: When the final puzzle engine is integrated, replace the
 * `extractValidationContext` and `compareGuess` calls with the
 * real puzzle engine's validate/compare interface.
 */

import { NextResponse } from "next/server";
import { getPuzzleById } from "@/lib/puzzles/puzzle-repository";
import { adaptPuzzle, extractValidationContext } from "@/lib/puzzles/puzzle-adapter";
import { validateGuess, compareGuess, normalizeExpression } from "@/lib/game/validator";
import type { ValidateGuessRequest } from "@/types/api";

export async function POST(req: Request) {
  let body: ValidateGuessRequest;

  try {
    body = (await req.json()) as ValidateGuessRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { puzzleId, guess, sessionKey, attemptNumber } = body;

  if (!puzzleId || !guess || !sessionKey) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  try {
    const transport = await getPuzzleById(puzzleId);
    if (!transport) {
      return NextResponse.json({ error: "퍼즐을 찾을 수 없습니다." }, { status: 404 });
    }

    const vm = adaptPuzzle(transport);
    const ctx = extractValidationContext(vm);

    // Validate the guess
    const normalized = normalizeExpression(guess);
    const validation = validateGuess(normalized, {
      length: ctx.length,
      allowedTokens: ctx.allowedTokens,
      variables: ctx.variables,
    });

    if (!validation.ok) {
      return NextResponse.json({
        ok: false,
        feedback: [],
        solved: false,
        gameOver: false,
        message: validation.message,
      });
    }

    // Compare against answer (answer stays server-side)
    const feedback = compareGuess(normalized, ctx.answer);
    const solved = feedback.every((f) => f === "correct");
    const gameOver = solved || attemptNumber >= vm.maxAttempts;

    return NextResponse.json({
      ok: true,
      feedback,
      solved,
      gameOver,
    });
  } catch (err) {
    console.error("[POST /api/validate-guess]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
