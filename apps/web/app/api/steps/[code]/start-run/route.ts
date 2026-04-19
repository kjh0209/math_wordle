import { NextResponse } from "next/server";
import { getStepByCode, selectPuzzleForStep } from "@mathdle/core";
import crypto from "crypto";
import type { StartRunRequest, StartRunResponse } from "@/types/api";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  let body: StartRunRequest;
  try {
    body = (await req.json()) as StartRunRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const step = getStepByCode(params.code);
  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  const [stageStr, stepStr] = params.code.split("-");
  const puzzle = selectPuzzleForStep(Number(stageStr), Number(stepStr));
  if (!puzzle) {
    return NextResponse.json({ error: "No puzzles configured for this step" }, { status: 500 });
  }

  const runId = crypto.randomUUID();

  return NextResponse.json<StartRunResponse>({
    runId,
    puzzle,
  });
}
