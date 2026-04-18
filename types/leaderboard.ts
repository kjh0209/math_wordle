/**
 * types/leaderboard.ts
 */

export type LeaderboardFilter = "today" | "all-time" | "practice";

export interface LeaderboardEntry {
  rank: number;
  sessionId: string;
  /** Short anonymized display name derived from sessionId */
  displayName: string;
  attemptsCount: number;
  clearTimeMs: number;
  clearedAt: string;
  puzzleId: string;
  mode: string;
}

export interface LeaderboardStats {
  puzzleId: string;
  dateKey: string | null;
  totalPlayers: number;
  totalClears: number;
  bestTimeMs: number | null;
  bestAttemptsCount: number | null;
}

export interface LeaderboardResponse {
  stats: LeaderboardStats;
  entries: LeaderboardEntry[];
  filter: LeaderboardFilter;
}
