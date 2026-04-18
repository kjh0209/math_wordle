/**
 * PATCH /api/admin/puzzles/[id] — Update puzzle
 * GET  /api/admin/puzzles/[id] — Get single puzzle (admin view with answer)
 *
 * TODO: Wire to Supabase once DB is provisioned
 */

import { NextResponse } from "next/server";
import { getPuzzleById } from "@/lib/puzzles/puzzle-repository";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transport = await getPuzzleById(params.id);
    if (!transport) {
      return NextResponse.json({ error: "퍼즐을 찾을 수 없습니다." }, { status: 404 });
    }
    // Admin endpoint: includes answer_payload
    return NextResponse.json({ puzzle: transport });
  } catch (err) {
    console.error("[GET /api/admin/puzzles/[id]]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as Record<string, unknown>;
    // TODO: Validate and apply partial update to Supabase
    console.log("[PATCH /api/admin/puzzles/[id]]", params.id, body);
    return NextResponse.json({
      message: "TODO: 퍼즐 업데이트가 구현되지 않았습니다.",
    }, { status: 501 });
  } catch (err) {
    console.error("[PATCH /api/admin/puzzles/[id]]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
