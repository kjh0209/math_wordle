/**
 * @deprecated Use /api/validate-guess and /api/results instead
 * Kept for backward compatibility during migration.
 */
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/api/validate-guess", request.url), {
    status: 308, // Permanent redirect preserving method
  });
}
