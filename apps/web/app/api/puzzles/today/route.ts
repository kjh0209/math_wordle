import { NextResponse } from "next/server";
import { getTodaysPuzzle } from "@/lib/puzzles/puzzle-repository";
import { adaptPuzzle } from "@/lib/puzzles/puzzle-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbRow = await getTodaysPuzzle();
    if (!dbRow) {
      return NextResponse.json({ error: "오늘의 퍼즐을 찾을 수 없습니다." }, { status: 404 });
    }

    // includeAnswer=false → strips meta.answerCells before sending to client
    const vm = adaptPuzzle(dbRow, false);
    return NextResponse.json({ puzzle: vm });
  } catch (err) {
    console.error("[GET /api/puzzles/today]", err);
    return NextResponse.json({ error: "퍼즐을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
