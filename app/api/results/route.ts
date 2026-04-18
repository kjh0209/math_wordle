/**
 * POST /api/results
 *
 * Save completed game result and generate share code.
 *
 * TODO: Replace in-memory mock store with Supabase play_records insert.
 */

import { NextResponse } from "next/server";
import { savePlayRecord } from "@/lib/leaderboard/leaderboard-service";
import { generateShareCode } from "@/lib/game/share";
import type { SubmitResultRequest } from "@/types/api";

export async function POST(req: Request) {
  let body: SubmitResultRequest;

  try {
    body = (await req.json()) as SubmitResultRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const {
    puzzleId,
    sessionKey,
    mode,
    attemptsCount,
    maxAttempts,
    cleared,
    clearTimeMs,
    startedAt,
    guessHistory,
    feedbackHistory,
  } = body;

  if (!puzzleId || !sessionKey) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  try {
    const recordId = crypto.randomUUID();
    const shareCode = generateShareCode(recordId);
    const completedAt = Date.now();

    await savePlayRecord({
      id: recordId,
      puzzleId,
      sessionKey,
      mode: mode ?? "daily",
      attemptsCount,
      maxAttempts,
      cleared: cleared ?? false,
      clearTimeMs: clearTimeMs ?? null,
      startedAt,
      completedAt: cleared ? completedAt : null,
      guessHistory: guessHistory ?? [],
      feedbackHistory: feedbackHistory ?? [],
      shareCode,
    });

    return NextResponse.json({
      ok: true,
      shareCode,
      playRecordId: recordId,
    });
  } catch (err) {
    console.error("[POST /api/results]", err);
    return NextResponse.json({ error: "결과 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
