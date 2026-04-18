/**
 * lib/leaderboard/leaderboard-service.ts
 *
 * Leaderboard data access and business logic.
 * Uses file-based mock data for development;
 * swap for Supabase queries when DB is ready.
 *
 * TODO: Implement Supabase branches once play_records table is populated.
 */

import type { LeaderboardEntry, LeaderboardStats, LeaderboardFilter, LeaderboardResponse } from "@/types/leaderboard";
import { sessionDisplayName } from "@/lib/utils/session";

// ─── In-memory mock store (dev only) ─────────────────────────────────────────

interface MockRecord {
  id: string;
  puzzle_id: string;
  session_key: string;
  mode: string;
  attempts_count: number;
  clear_time_ms: number;
  cleared: boolean;
  completed_at: string;
}

// Shared in-process store for route handlers (resets on server restart)
const _mockRecords: MockRecord[] = [];

export function addMockRecord(record: MockRecord) {
  _mockRecords.push(record);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getLeaderboard(
  puzzleId: string,
  filter: LeaderboardFilter = "today"
): Promise<LeaderboardResponse> {
  // TODO: Replace with Supabase query once play_records is populated:
  // const { data } = await supabase
  //   .from("play_records")
  //   .select("*")
  //   .eq("puzzle_id", puzzleId)
  //   .eq("cleared", true)
  //   .order("attempts_count", { ascending: true })
  //   .order("clear_time_ms", { ascending: true })
  //   .limit(50);

  const cleared = _mockRecords
    .filter((r) => r.puzzle_id === puzzleId && r.cleared)
    .sort((a, b) => {
      if (a.attempts_count !== b.attempts_count) return a.attempts_count - b.attempts_count;
      return a.clear_time_ms - b.clear_time_ms;
    });

  const entries: LeaderboardEntry[] = cleared.map((r, i) => ({
    rank: i + 1,
    sessionId: r.session_key,
    displayName: sessionDisplayName(r.session_key),
    attemptsCount: r.attempts_count,
    clearTimeMs: r.clear_time_ms,
    clearedAt: r.completed_at,
    puzzleId: r.puzzle_id,
    mode: r.mode,
  }));

  const stats: LeaderboardStats = {
    puzzleId,
    dateKey: new Date().toISOString().split("T")[0],
    totalPlayers: _mockRecords.filter((r) => r.puzzle_id === puzzleId).length,
    totalClears: cleared.length,
    bestTimeMs: cleared[0]?.clear_time_ms ?? null,
    bestAttemptsCount: cleared[0]?.attempts_count ?? null,
  };

  return { stats, entries, filter };
}

export async function savePlayRecord(record: {
  id: string;
  puzzleId: string;
  sessionKey: string;
  mode: string;
  attemptsCount: number;
  maxAttempts: number;
  cleared: boolean;
  clearTimeMs: number | null;
  startedAt: number;
  completedAt: number | null;
  guessHistory: string[];
  feedbackHistory: unknown[];
  shareCode: string;
}): Promise<void> {
  // TODO: Replace with Supabase insert:
  // await supabase.from("play_records").insert({ ... });

  addMockRecord({
    id: record.id,
    puzzle_id: record.puzzleId,
    session_key: record.sessionKey,
    mode: record.mode,
    attempts_count: record.attemptsCount,
    clear_time_ms: record.clearTimeMs ?? 0,
    cleared: record.cleared,
    completed_at: record.completedAt
      ? new Date(record.completedAt).toISOString()
      : new Date().toISOString(),
  });
}
