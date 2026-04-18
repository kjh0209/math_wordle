import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard/leaderboard-service";
import type { LeaderboardFilter } from "@/types/leaderboard";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const puzzleId = searchParams.get("puzzleId");
  const filter = (searchParams.get("filter") ?? "today") as LeaderboardFilter;

  if (!puzzleId) {
    return NextResponse.json({ error: "puzzleId is required" }, { status: 400 });
  }

  try {
    const data = await getLeaderboard(puzzleId, filter);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/leaderboard]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
