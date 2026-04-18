/**
 * GET /api/admin/generation-jobs
 *
 * TODO: Fetch from puzzle_generation_jobs table once pipeline is live
 */

import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Query Supabase puzzle_generation_jobs table
  return NextResponse.json({ items: [], total: 0 });
}
