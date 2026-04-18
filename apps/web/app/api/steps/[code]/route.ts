import { NextResponse } from "next/server";
import { getMockStepByCode } from "@mathdle/core";
import type { GetStepIntroResponse } from "@/types/api";

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const step = getMockStepByCode(params.code);
  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 404 });
  }

  return NextResponse.json<GetStepIntroResponse>({
    step,
    progress: null,
  });
}
