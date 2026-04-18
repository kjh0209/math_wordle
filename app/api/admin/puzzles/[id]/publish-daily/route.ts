/**
 * POST /api/admin/puzzles/[id]/publish-daily
 *
 * Set a puzzle as the daily puzzle for a given date.
 *
 * TODO: Implement Supabase update:
 * UPDATE puzzles SET is_daily=true, daily_date=$date, validation_status='published'
 * WHERE id=$id
 * Also ensure no other puzzle has the same daily_date.
 */

import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as { date: string };
    const { date } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "유효한 날짜 형식(YYYY-MM-DD)이 필요합니다." },
        { status: 400 }
      );
    }

    // TODO: Supabase transaction:
    // 1. Unset any existing daily puzzle for that date
    // 2. Set this puzzle as daily for the given date
    // 3. Set validation_status = 'published'

    console.log("[POST /api/admin/puzzles/[id]/publish-daily]", params.id, date);

    return NextResponse.json({
      message: `TODO: ${params.id}를 ${date}의 데일리 퍼즐로 게시하는 기능이 구현되지 않았습니다.`,
    }, { status: 501 });
  } catch (err) {
    console.error("[POST publish-daily]", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
