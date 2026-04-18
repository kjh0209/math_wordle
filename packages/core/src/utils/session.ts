export function sessionDisplayName(sessionKey: string): string {
  const short = sessionKey.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `Player ${short}`;
}

export function formatTime(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
