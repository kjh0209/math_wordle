import { NextResponse } from "next/server";
import { getRandomPuzzle } from "@/lib/puzzles/puzzle-repository";
import { adaptPuzzle } from "@/lib/puzzles/puzzle-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const transport = await getRandomPuzzle();

    if (!transport) {
      return NextResponse.json({ error: "퍼즐을 찾을 수 없습니다." }, { status: 404 });
    }

    const vm = adaptPuzzle(transport);
    const safeVm = { ...vm, meta: { ...vm.meta, answer: undefined } };

    return NextResponse.json({ puzzle: safeVm });
  } catch (err) {
    console.error("[GET /api/puzzles/random]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
