/**
 * packages/core — Share text generation
 * Platform-agnostic pure functions.
 */

import type { FeedbackColor } from "../types/game";
import type { SharePayload, ShareState, SerializedShareState } from "../types/share";

const EMOJI: Record<FeedbackColor, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
};

export function rowToEmoji(row: FeedbackColor[]): string {
  return row.map((c) => EMOJI[c]).join("");
}

export function buildEmojiGrid(rows: FeedbackColor[][]): string {
  return rows.map(rowToEmoji).join("\n");
}

export function generateShareText(payload: SharePayload): string {
  const { puzzleTitle, solved, attemptsUsed, maxAttempts, rows, appUrl, shareCode } = payload;
  const score = solved ? `${attemptsUsed}/${maxAttempts}` : `X/${maxAttempts}`;
  const title = `${puzzleTitle} ${score}`;
  const grid = buildEmojiGrid(rows);
  const link = `${appUrl}/share/${shareCode}`;
  return `${title}\n${grid}\n${link}`;
}

export function createSharePayload(payload: SharePayload): SerializedShareState {
  return {
    code: payload.shareCode,
    puzzleId: payload.puzzleId,
    puzzleTitle: payload.puzzleTitle,
    solved: payload.solved,
    attemptsUsed: payload.attemptsUsed,
    maxAttempts: payload.maxAttempts,
    clearTimeMs: payload.clearTimeMs,
    emojiGrid: buildEmojiGrid(payload.rows),
    createdAt: new Date().toISOString(),
  };
}

export function buildShareState(payload: SharePayload): ShareState {
  return {
    text: generateShareText(payload),
    link: `${payload.appUrl}/share/${payload.shareCode}`,
    shareCode: payload.shareCode,
    emojiGrid: buildEmojiGrid(payload.rows),
  };
}

export function generateShareCode(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
