/**
 * lib/game/share.ts
 *
 * Share text generation and share payload helpers.
 * Kept generic so the exact tile emoji logic can evolve with the puzzle engine.
 */

import type { FeedbackColor } from "@/types/game";
import type { SharePayload, ShareState, SerializedShareState } from "@/types/share";

const EMOJI: Record<FeedbackColor, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
};

/** Convert a row of feedback colors to an emoji string */
export function rowToEmoji(row: FeedbackColor[]): string {
  return row.map((c) => EMOJI[c]).join("");
}

/** Build the emoji grid (multi-line) for sharing */
export function buildEmojiGrid(rows: FeedbackColor[][]): string {
  return rows.map(rowToEmoji).join("\n");
}

/**
 * Generate the full share text (Wordle-style).
 * The format is intentionally configurable — just the puzzle title and
 * attempt count scheme might change once the final puzzle format is set.
 */
export function generateShareText(payload: SharePayload): string {
  const { puzzleTitle, solved, attemptsUsed, maxAttempts, rows, appUrl, shareCode } = payload;

  const score = solved ? `${attemptsUsed}/${maxAttempts}` : `X/${maxAttempts}`;
  const title = `${puzzleTitle} ${score}`;
  const grid = buildEmojiGrid(rows);
  const link = `${appUrl}/share/${shareCode}`;

  return `${title}\n${grid}\n${link}`;
}

/** Create a serialized share state for storage and retrieval */
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

/** Build the full share state with text, link, and emoji grid */
export function buildShareState(payload: SharePayload): ShareState {
  return {
    text: generateShareText(payload),
    link: `${payload.appUrl}/share/${payload.shareCode}`,
    shareCode: payload.shareCode,
    emojiGrid: buildEmojiGrid(payload.rows),
  };
}

/** Generate a short share code from a play record ID */
export function generateShareCode(playRecordId: string): string {
  // Use the first 8 chars of the UUID without dashes
  return playRecordId.replace(/-/g, "").slice(0, 8).toUpperCase();
}
