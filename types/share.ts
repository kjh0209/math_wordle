/**
 * types/share.ts
 */

import type { FeedbackColor, GameMode } from "./game";

export interface SharePayload {
  puzzleId: string;
  puzzleTitle: string;
  mode: GameMode;
  solved: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  clearTimeMs: number | null;
  /** Each element is the feedback row: array of FeedbackColor per attempt */
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

/** Serialized share state stored in URL/DB for the /share/[code] page */
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
