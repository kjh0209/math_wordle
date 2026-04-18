import { NextResponse } from "next/server";
import { getMockStageById, getMockStepsForStage } from "@mathdle/core";
import type { GetStageDetailResponse } from "@/types/api";

export async function GET(req: Request, { params }: { params: { stageId: string } }) {
  const stage = getMockStageById(params.stageId);
  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const steps = getMockStepsForStage(stage.id);

  const stageWithSteps = {
    ...stage,
    steps,
  };

  return NextResponse.json<GetStageDetailResponse>({
    stage: stageWithSteps,
    progress: null,
    stepProgress: [],
  });
}
