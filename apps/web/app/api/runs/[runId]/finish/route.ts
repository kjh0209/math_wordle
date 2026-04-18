import { NextResponse } from "next/server";
import { calculateNextStepProgress } from "@mathdle/core";
import type { FinishRunRequest, FinishRunResponse } from "@/types/api";

export async function POST(req: Request, { params }: { params: { runId: string } }) {
  let body: FinishRunRequest;
  try {
    body = (await req.json()) as FinishRunRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  // TODO: Validate that runId actually exists via DB and matches sessionKey

  // Calculate new progress (mock: passing null as currentProgress)
  // In reality, fetch from user_step_progress where session == body.sessionKey
  
  // Fake a step ID since we don't have DB linkage right here just from runId
  // This is a temporary mockup for the offline testing
  const mockStepId = "step-1-1"; 

  const newProgress = calculateNextStepProgress(
    null,
    body.sessionKey,
    mockStepId,
    body.puzzleId,
    body.cleared,
    body.attemptsCount,
    body.clearTimeMs
  );

  return NextResponse.json<FinishRunResponse>({
    ok: true,
    nextStepUnlocked: body.cleared, // mock assumption
    newProgress,
  });
}
