/**
 * types/api.ts
 *
 * Request/response shapes for all API routes.
 * Keeping these separate from DB and view model types prevents leaking
 * internal storage details through the API boundary.
 */

import type { PuzzleViewModel, PuzzleSummary, PuzzleGenerationJob, PuzzleCell } from "./puzzle";
import type { FeedbackColor, GameMode, NestedFeedback } from "./game";
import type { LeaderboardEntry, LeaderboardStats, LeaderboardFilter } from "./leaderboard";
import type { SerializedShareState } from "./share";

// ─── Generic ─────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Puzzle routes ────────────────────────────────────────────────────────────

export interface GetPuzzleResponse {
  puzzle: PuzzleViewModel;
}

// ─── Guess validation ─────────────────────────────────────────────────────────

export interface ValidateGuessRequest {
  puzzleId: string;
  /** The player's guess as an array of puzzle cells */
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
  /** Human-readable validation message if ok=false */
  message?: string;
}

// ─── Progression & Stages ───────────────────────────────────────────────────

export interface GetStagesResponse {
  stages: (import("@mathdle/core").StageMapNode & { steps: import("@mathdle/core").StageStep[] })[];
}

export interface GetStageDetailResponse {
  stage: import("@mathdle/core").StageWithSteps;
  progress: import("@mathdle/core").UserStageProgress | null;
  stepProgress: import("@mathdle/core").UserStepProgress[];
}

export interface GetStepIntroResponse {
  step: import("@mathdle/core").StageStep;
  progress: import("@mathdle/core").UserStepProgress | null;
}

export interface StartRunRequest {
  sessionKey: string;
}

export interface StartRunResponse {
  runId: string;
  puzzle: import("@mathdle/core").PuzzleViewModel;
}

// ─── Results & Runs ──────────────────────────────────────────────────────────

export interface FinishRunRequest {
  runId: string;
  puzzleId: string;
  stepCode: string;
  sessionKey: string;
  cleared: boolean;
  attemptsCount: number;
  clearTimeMs: number | null;
  guessHistory: import("@mathdle/core").StepRunGuess[];
}

export interface FinishRunResponse {
  ok: boolean;
  nextStepUnlocked: boolean;
  newProgress: import("@mathdle/core").UserStepProgress;
}

// ─── Legacy Results (To Be Deprecated) ────────────────────────────────────────

export interface SubmitResultRequest {
  puzzleId: string;
  sessionKey: string;
  mode: GameMode;
  attemptsCount: number;
  maxAttempts: number;
  cleared: boolean;
  clearTimeMs: number | null;
  startedAt: number;
  /** Token strings per attempt */
  guessHistory: string[];
  /** Color feedback per attempt */
  feedbackHistory: NestedFeedback[][];
}

export interface SubmitResultResponse {
  ok: boolean;
  shareCode: string;
  playRecordId: string;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface GetLeaderboardResponse {
  stats: LeaderboardStats;
  entries: LeaderboardEntry[];
  filter: LeaderboardFilter;
}

// ─── Share ────────────────────────────────────────────────────────────────────

export interface GetShareResponse {
  found: boolean;
  share: SerializedShareState | null;
}

// ─── Admin routes ─────────────────────────────────────────────────────────────

export interface AdminGetPuzzlesResponse {
  items: PuzzleSummary[];
  total: number;
}

export interface AdminCreatePuzzleRequest {
  type: string;
  title: string;
  raw_payload: unknown;
  difficulty?: string;
  category?: string;
  explanation?: string;
  token_length?: number;
}

export interface AdminUpdatePuzzleRequest {
  title?: string;
  raw_payload?: unknown;
  display_payload?: unknown;
  difficulty?: string;
  category?: string;
  explanation?: string;
  token_length?: number;
  validation_status?: string;
  is_public?: boolean;
}

export interface AdminPublishDailyRequest {
  date: string; // YYYY-MM-DD
}

export interface AdminGeneratePuzzleRequest {
  type?: string;
  category?: string;
  difficulty?: string;
  constraints?: Record<string, unknown>;
}

export interface AdminGetJobsResponse {
  items: PuzzleGenerationJob[];
  total: number;
}
