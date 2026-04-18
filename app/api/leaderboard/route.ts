import { NextResponse } from "next/server";
import { getLeaderboard, getPuzzleById } from "@/lib/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const puzzleId = searchParams.get("puzzleId") ?? undefined;
    const puzzle = getPuzzleById(puzzleId);

    return NextResponse.json({
      puzzleId: puzzle.id,
      items: getLeaderboard(puzzle.id)
    });
  } catch {
    return NextResponse.json({ message: "리더보드를 불러오지 못했습니다." }, { status: 500 });
  }
}
