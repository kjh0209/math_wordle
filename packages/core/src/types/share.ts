import type { FeedbackColor, GameMode } from "./game";

export interface SharePayload {
  puzzleId: string;
  puzzleTitle: string;
  mode: GameMode;
  solved: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  clearTimeMs: number | null;
  rows: FeedbackColor[][];
  shareCode: string;
  appUrl: string;
}

export interface ShareState {
  text: string;
  link: string;
  shareCode: string;
  emojiGrid: string;
}

export interface SerializedShareState {
  code: string;
  puzzleId: string;
  puzzleTitle: string;
  solved: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  clearTimeMs: number | null;
  emojiGrid: string;
  createdAt: string;
}
