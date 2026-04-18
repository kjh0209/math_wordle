import { NextResponse } from "next/server";
import {
  calculateNextStepProgress,
  getMockStepByCode,
  getMockStepById,
} from "@mathdle/core";
import type { FinishRunRequest, FinishRunResponse } from "@/types/api";

/**
 * POST /api/runs/[runId]/finish
 *
 * Records the outcome of a step run and updates progression state.
 * When Supabase is wired, `runId` will be used to look up the run record
 * to get the correct stepId/puzzleId. For now the client sends them.
 */
export async function POST(
  req: Request,
  { params }: { params: { runId: string } }
) {
  let body: FinishRunRequest;
  try {
    body = (await req.json()) as FinishRunRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  // Resolve step — body carries stepCode so we can look it up without DB
  const step = body.stepCode
    ? getMockStepByCode(body.stepCode)
    : null;

  const stepId = step?.id ?? "unknown-step";

  const newProgress = calculateNextStepProgress(
    null, // currentProgress — would come from DB in production
    body.sessionKey,
    stepId,
    body.puzzleId,
    body.cleared,
    body.attemptsCount,
    body.clearTimeMs
  );

  // Determine if next step is now unlocked
  const nextStepUnlocked = body.cleared && step !== null;

  return NextResponse.json<FinishRunResponse>({
    ok: true,
    nextStepUnlocked,
    newProgress,
  });
}
