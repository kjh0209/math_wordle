/**
 * @deprecated Use /api/puzzles/today instead
 * Kept for backward compatibility during migration.
 */
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    return NextResponse.redirect(new URL(`/api/puzzles/${id}`, request.url));
  }
  return NextResponse.redirect(new URL("/api/puzzles/today", request.url));
}
