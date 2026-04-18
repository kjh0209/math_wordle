/**
 * types/game.ts
 *
 * Game session, state machine, and interaction types.
 * These are intentionally decoupled from the puzzle schema
 * so the game engine can be swapped independently.
 */

import type { TokenUnit } from "./puzzle";

// ─── State Machine ───────────────────────────────────────────────────────────

export type GameStatus =
  | "idle"       // No puzzle loaded
  | "loading"    // Fetching puzzle
  | "playing"    // Active game
  | "win"        // Correct answer submitted
  | "lose"       // Max attempts exceeded
  | "error";     // Fatal error state

export type GameMode = "daily" | "practice" | "shared";

// ─── Tile / Row State ────────────────────────────────────────────────────────

/** Per-tile coloring feedback from the answer checker */
export type FeedbackColor = "correct" | "present" | "absent";

/** Visual state of a tile in the grid */
export type TileState =
  | "empty"     // No input
  | "active"    // Currently being entered
  | "correct"   // Right position
  | "present"   // In answer, wrong position
  | "absent"    // Not in answer
  | "invalid"   // Failed validation (shake animation)
  | "revealing" // Mid-flip animation
  | "pending";  // Submitted but awaiting response

export interface GuessRow {
  tokens: TokenUnit[];
  feedback: FeedbackColor[];
  status: "empty" | "active" | "submitted" | "invalid";
  /** Staggered reveal index for animations */
  revealIndex?: number;
}

// ─── Core Game State ─────────────────────────────────────────────────────────

export interface GameState {
  puzzleId: string;
  mode: GameMode;
  status: GameStatus;
  rows: GuessRow[];
  currentTokens: TokenUnit[];
  errorMessage: string | null;
  startedAt: number;
  completedAt: number | null;
  attemptCount: number;
  maxAttempts: number;
  shareCode: string | null;
}

// ─── Keyboard State ──────────────────────────────────────────────────────────

/** Best known state for each key value across all submitted guesses */
export type KeyState = FeedbackColor | "unused";

export type KeyboardState = Record<string, KeyState>;

// ─── Persistence ─────────────────────────────────────────────────────────────

export interface LocalGameRecord {
  puzzleId: string;
  mode: GameMode;
  status: "playing" | "win" | "lose";
  rows: GuessRow[];
  currentTokens: TokenUnit[];
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
  /** Attempt count → win count (for distribution bar chart) */
  distribution: Record<number, number>;
}

// ─── Toast / Message ─────────────────────────────────────────────────────────

export type ToastType = "error" | "success" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
}
