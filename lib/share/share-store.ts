/**
 * lib/share/share-store.ts
 *
 * In-memory share record store (dev mock).
 * TODO: Replace with Supabase play_records query by share_code.
 */

export interface ShareRecord {
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

// Server-side in-process store (resets on server restart)
const _store: Record<string, ShareRecord> = {};

export function saveShareRecord(record: ShareRecord) {
  _store[record.code] = record;
}

export function getShareRecord(code: string): ShareRecord | null {
  return _store[code] ?? null;
}
