import { NextResponse } from "next/server";
import { getPuzzleById } from "@/lib/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") ?? undefined;
    const puzzle = getPuzzleById(id);

    return NextResponse.json({
      id: puzzle.id,
      length: puzzle.length,
      variables: puzzle.variables,
      allowedTokens: puzzle.allowedTokens,
      maxAttempts: puzzle.maxAttempts,
      difficulty: puzzle.difficulty
    });
  } catch {
    return NextResponse.json({ message: "퍼즐을 불러오지 못했습니다." }, { status: 500 });
  }
}
