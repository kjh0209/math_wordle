import { NextResponse } from "next/server";
import { getTodaysPuzzle } from "@/lib/puzzles/puzzle-repository";
import { adaptPuzzle } from "@/lib/puzzles/puzzle-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const transport = await getTodaysPuzzle();

    if (!transport) {
      return NextResponse.json(
        { error: "오늘의 퍼즐을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Never expose answer_payload in the response
    const vm = adaptPuzzle(transport);
    // Strip the answer from meta before sending to client
    const safeVm = {
      ...vm,
      meta: {
        ...vm.meta,
        answer: undefined, // Do NOT expose the answer
      },
    };

    return NextResponse.json({ puzzle: safeVm });
  } catch (err) {
    console.error("[GET /api/puzzles/today]", err);
    return NextResponse.json(
      { error: "퍼즐을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
