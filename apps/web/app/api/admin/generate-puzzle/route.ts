/**
 * POST /api/admin/generate-puzzle
 *
 * Trigger AI puzzle generation.
 *
 * TODO: Integrate with OpenAI (or other LLM) to generate puzzle JSON.
 * The generation pipeline should:
 * 1. Build a prompt from the request constraints
 * 2. Call the LLM API
 * 3. Parse and validate the response against the (TBD) puzzle schema
 * 4. Insert a puzzle_generation_jobs row with status=pending
 * 5. On success, insert a puzzles row with validation_status=draft
 * 6. Return the job ID for polling
 */

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: {
    type?: string;
    category?: string;
    difficulty?: string;
    constraints?: Record<string, unknown>;
  };

  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  // TODO: Replace placeholder with real OpenAI generation
  // Example integration points:
  // 1. const prompt = buildGenerationPrompt(body);
  // 2. const response = await openai.chat.completions.create({ ... });
  // 3. const parsed = parsePuzzleFromLLMResponse(response);
  // 4. const job = await supabase.from("puzzle_generation_jobs").insert({ ... });

  const jobId = crypto.randomUUID();

  console.log("[POST /api/admin/generate-puzzle] request:", body, "jobId:", jobId);

  return NextResponse.json({
    jobId,
    status: "pending",
    message: "TODO: OpenAI 생성 파이프라인이 아직 구현되지 않았습니다.",
  });
}
