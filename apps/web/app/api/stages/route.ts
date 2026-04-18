import { NextResponse } from "next/server";
import { getMockStages } from "@mathdle/core";
import type { GetStagesResponse } from "@/types/api";

export async function GET() {
  const stages = getMockStages();
  
  // Maps simple stages into StageMapNode. Progress is null for now until complete auth is wired.
  const nodes = stages.map(stage => ({
    stage,
    progress: null, // to be populated
  }));

  return NextResponse.json<GetStagesResponse>({ stages: nodes });
}
