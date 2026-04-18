import { NextResponse } from "next/server";
import { buildShareText, compareGuess, validateGuess } from "@/lib/game";
import { getPuzzleById, saveResult } from "@/lib/store";
import type { FeedbackColor } from "@/lib/types";

type Body = {
  puzzleId?: string;
  guess: string;
  sessionId: string;
  attemptsCount: number;
  startTimeMs: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const puzzle = getPuzzleById(body.puzzleId);
    const guess = body.guess.replace(/\s+/g, "");
    const validation = validateGuess(guess, puzzle);

    if (!validation.ok) {
      return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });
    }

    const colors = compareGuess(guess, puzzle.answer);
    const solved = guess === puzzle.answer;
    const clearTimeMs = Math.max(0, Date.now() - body.startTimeMs);

    if (solved || body.attemptsCount >= puzzle.maxAttempts) {
      saveResult({
        puzzleId: puzzle.id,
        sessionId: body.sessionId,
        attemptsCount: body.attemptsCount,
        cleared: solved,
        clearTimeMs,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      ok: true,
      solved,
      colors,
      shareText: buildShareText(
        puzzle.id,
        solved,
        body.attemptsCount,
        puzzle.maxAttempts,
        colors
      ),
      gameOver: solved || body.attemptsCount >= puzzle.maxAttempts
    });
  } catch {
    return NextResponse.json({ ok: false, message: "결과 처리에 실패했습니다." }, { status: 500 });
  }
}
