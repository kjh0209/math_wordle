import { NextResponse } from "next/server";
import { getPuzzleById } from "@/lib/puzzles/puzzle-repository";
import { adaptPuzzle } from "@/lib/puzzles/puzzle-adapter";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transport = await getPuzzleById(params.id);

    if (!transport) {
      return NextResponse.json(
        { error: "퍼즐을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!transport.is_public && transport.validation_status !== "published") {
      return NextResponse.json({ error: "접근할 수 없는 퍼즐입니다." }, { status: 403 });
    }

    const vm = adaptPuzzle(transport);
    const safeVm = {
      ...vm,
      meta: { ...vm.meta, answer: undefined },
    };

    return NextResponse.json({ puzzle: safeVm });
  } catch (err) {
    console.error("[GET /api/puzzles/[id]]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
