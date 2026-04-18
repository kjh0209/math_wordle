/**
 * packages/core — Game state types
 * Updated for cell-based puzzle spec.
 * Platform-agnostic: used by both web and mobile.
 */

import type { PuzzleCell } from "./puzzle";

export type GameStatus =
  | "idle"
  | "loading"
  | "playing"
  | "win"
  | "lose"
  | "error";

export type GameMode = "daily" | "practice" | "shared";

export type FeedbackColor = "correct" | "present" | "absent";

export interface NestedFeedback {
  color: FeedbackColor;
  fields?: Record<string, NestedFeedback[]>;
}

export type TileState =
  | "empty"
  | "active"
  | "correct"
  | "present"
  | "absent"
  | "invalid"
  | "revealing"
  | "pending";

export interface GuessRow {
  /** Cells the player submitted — token or block cells */
  cells: PuzzleCell[];
  feedback: NestedFeedback[];
  status: "empty" | "active" | "submitted" | "invalid";
  revealIndex?: number;
}

export interface GameState {
  puzzleId: string;
  mode: GameMode;
  status: GameStatus;
  rows: GuessRow[];
  /** Cells being built for the current guess */
  currentCells: PuzzleCell[];
  errorMessage: string | null;
  startedAt: number;
  completedAt: number | null;
  attemptCount: number;
  maxAttempts: number;
  shareCode: string | null;
}

export type KeyState = FeedbackColor | "unused";
/** Maps cell display key (token value or blockType) → best color seen */
export type KeyboardState = Record<string, KeyState>;

export interface LocalGameRecord {
  puzzleId: string;
  mode: GameMode;
  status: "playing" | "win" | "lose";
  rows: GuessRow[];
  currentCells: PuzzleCell[];
  startedAt: number;
  completedAt: number | null;
  savedAt: number;
}

export interface SessionStats {
  totalGames: number;
  totalWins: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
  lastPlayedPuzzleId: string | null;
  distribution: Record<number, number>;
}

export type ToastType = "error" | "success" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
}
