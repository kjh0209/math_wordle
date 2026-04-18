/**
 * packages/core — API client
 * Shared fetch wrapper for web and mobile.
 */

import type { PuzzleViewModel } from "../types/puzzle";
import type { PuzzleCell } from "../types/puzzle";
import type { FeedbackColor, GameMode, NestedFeedback } from "../types/game";
import type { LeaderboardFilter, LeaderboardResponse } from "../types/leaderboard";

let _baseUrl = "";

export function configureApiBaseUrl(url: string) {
  _baseUrl = url.replace(/\/$/, "");
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = _baseUrl ? `${_baseUrl}${path}` : path;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Puzzle routes ────────────────────────────────────────────────────────────

export async function fetchTodaysPuzzle(): Promise<PuzzleViewModel> {
  const data = await apiFetch<{ puzzle: PuzzleViewModel }>("/api/puzzles/today");
  return data.puzzle;
}

export async function fetchPuzzleById(id: string): Promise<PuzzleViewModel> {
  const data = await apiFetch<{ puzzle: PuzzleViewModel }>(`/api/puzzles/${id}`);
  return data.puzzle;
}

export async function fetchRandomPuzzle(): Promise<PuzzleViewModel> {
  const data = await apiFetch<{ puzzle: PuzzleViewModel }>("/api/puzzles/random");
  return data.puzzle;
}

// ─── Guess validation ─────────────────────────────────────────────────────────

export interface ValidateGuessRequest {
  puzzleId: string;
  /** The player's guess as an ordered array of cells */
  guessCells: PuzzleCell[];
  sessionKey: string;
  attemptNumber: number;
  startTimeMs: number;
}

export interface ValidateGuessResponse {
  ok: boolean;
  feedback: NestedFeedback[];
  solved: boolean;
  gameOver: boolean;
  message?: string;
}

export async function validateGuessApi(
  req: ValidateGuessRequest
): Promise<ValidateGuessResponse> {
  return apiFetch<ValidateGuessResponse>("/api/validate-guess", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// ─── Results ──────────────────────────────────────────────────────────────────

export interface SubmitResultRequest {
  puzzleId: string;
  sessionKey: string;
  mode: GameMode;
  attemptsCount: number;
  maxAttempts: number;
  cleared: boolean;
  clearTimeMs: number | null;
  startedAt: number;
  /** Each guess as a serialized cell array (JSON string) */
  guessHistory: string[];
  feedbackHistory: NestedFeedback[][];
}

export async function submitResult(
  req: SubmitResultRequest
): Promise<{ shareCode: string }> {
  const data = await apiFetch<{ shareCode: string; playRecordId: string }>(
    "/api/results",
    { method: "POST", body: JSON.stringify(req) }
  );
  return { shareCode: data.shareCode };
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function fetchLeaderboard(
  puzzleId: string,
  filter: LeaderboardFilter = "today"
): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>(
    `/api/leaderboard?puzzleId=${encodeURIComponent(puzzleId)}&filter=${filter}`
  );
}

// ─── Share ────────────────────────────────────────────────────────────────────

export async function fetchShare(code: string) {
  return apiFetch<{ found: boolean; share: unknown }>(`/api/share/${code}`);
}
