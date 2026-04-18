import { NextResponse } from "next/server";
import { getMockStages, MOCK_STEPS } from "@mathdle/core";
import type { GetStagesResponse } from "@/types/api";

export async function GET() {
  const stages = getMockStages();

  const nodes = stages.map(stage => ({
    stage,
    steps: MOCK_STEPS.filter(s => s.stageId === stage.id),
    progress: null,
  }));

  return NextResponse.json<GetStagesResponse>({ stages: nodes });
}
