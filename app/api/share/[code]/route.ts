/**
 * GET /api/share/[code]
 *
 * Retrieve a shared result by share code.
 *
 * TODO: Replace in-memory mock with Supabase play_records lookup
 * using the share_code column.
 */

import { NextResponse } from "next/server";
import { getShareRecord } from "@/lib/share/share-store";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  const share = getShareRecord(code);

  if (!share) {
    // Return a demo share for testing the UI
    const demoShare = {
      code,
      puzzleId: "daily-001",
      puzzleTitle: "Mathdle #1",
      solved: true,
      attemptsUsed: 4,
      maxAttempts: 6,
      clearTimeMs: 45000,
      emojiGrid: "⬛🟨⬛🟨⬛\n🟩⬛🟨⬛🟨\n🟩🟩⬛🟩⬛\n🟩🟩🟩🟩🟩",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ found: true, share: demoShare });
  }

  return NextResponse.json({ found: true, share });
}
