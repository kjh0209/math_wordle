/**
 * Admin puzzle routes
 * GET  /api/admin/puzzles  — List all puzzles (admin)
 * POST /api/admin/puzzles  — Create a new puzzle
 *
 * TODO: Add proper auth middleware (check ADMIN_SECRET header or session)
 * TODO: Wire POST to Supabase insert once schema is finalized
 */

import { NextResponse } from "next/server";
import { adminGetAllPuzzles } from "@/lib/puzzles/puzzle-repository";

export async function GET() {
  try {
    const puzzles = await adminGetAllPuzzles();
    return NextResponse.json({ items: puzzles, total: puzzles.length });
  } catch (err) {
    console.error("[GET /api/admin/puzzles]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      type: string;
      title: string;
      raw_payload: unknown;
      difficulty?: string;
      category?: string;
    };

    // TODO: Validate body against final puzzle schema
    // TODO: Insert into Supabase puzzles table
    // const { data, error } = await supabase.from("puzzles").insert({ ... })

    console.log("[POST /api/admin/puzzles] body:", body);

    // Placeholder response
    return NextResponse.json({
      id: crypto.randomUUID(),
      message: "TODO: 퍼즐 생성이 구현되지 않았습니다. Supabase 연동 후 활성화됩니다.",
    }, { status: 501 });
  } catch (err) {
    console.error("[POST /api/admin/puzzles]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
