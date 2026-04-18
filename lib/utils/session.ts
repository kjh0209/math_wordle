/**
 * lib/utils/session.ts
 *
 * Anonymous session management via localStorage.
 * Each browser gets a stable UUID that identifies the player
 * on the leaderboard without requiring auth.
 */

const SESSION_KEY = "mathdle-session-key";

/** Get or create an anonymous session key (browser only) */
export function getSessionKey(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

/** Derive a short, human-readable display name from session UUID */
export function sessionDisplayName(sessionKey: string): string {
  // Use first 8 hex chars → display as "Player A1B2C3D4"
  const short = sessionKey.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `Player ${short}`;
}

/** Format milliseconds as "mm:ss" or "X.Xs" for short times */
export function formatTime(ms: number): string {
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
