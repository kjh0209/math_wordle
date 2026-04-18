/**
 * packages/core/src/game/progression.ts
 *
 * Business logic for the stage-based progression system.
 */

import type { StepPuzzlePoolEntry, UserStepProgress } from "../types/progression";

/**
 * Selects the next puzzle to play for a given step.
 * 
 * Rules:
 * 1. Prefer puzzles not yet seen by the user.
 * 2. If all variants have been seen, prefer the one least recently used (not strictly tracked by timestamp yet, so we pick randomly among all).
 * 3. Incorporate weight (if all unseen, or all seen, pick randomly weighted).
 */
export function selectPuzzleForStepRun(
  poolEntries: StepPuzzlePoolEntry[],
  progress: UserStepProgress | null
): StepPuzzlePoolEntry | null {
  const activeEntries = poolEntries.filter(e => e.isActive);
  if (activeEntries.length === 0) return null;

  const seenIds = new Set(progress?.seenPuzzleIds || []);

  // Filter 1: Unseen puzzles
  const unseenEntries = activeEntries.filter(e => !seenIds.has(e.puzzleId));

  // If there are unseen puzzles, we randomly select from them based on weight
  if (unseenEntries.length > 0) {
    return selectWeightedRandom(unseenEntries);
  }

  // Filter 2: All puzzles seen. We just select randomly from all active based on weight
  // In a future enhancement, we could track 'lastPlayedAt' per puzzleId to explicitly pick the oldest,
  // but for now, random weighted fallback satisfies the basic rotation requirement if they exhaust the pool.
  return selectWeightedRandom(activeEntries);
}

/**
 * Helper to select an entry based on its integer weight.
 */
function selectWeightedRandom(entries: StepPuzzlePoolEntry[]): StepPuzzlePoolEntry {
  if (entries.length === 1) return entries[0];
  
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  let randomValue = Math.random() * totalWeight;

  for (const entry of entries) {
    randomValue -= entry.weight;
    if (randomValue <= 0) {
      return entry;
    }
  }

  // Fallback (e.g. float precision issues)
  return entries[entries.length - 1];
}

/**
 * Calculates new step progress data after a run finishes.
 */
export function calculateNextStepProgress(
  currentProgress: UserStepProgress | null,
  sessionId: string,
  stepId: string,
  puzzleId: string,
  isClear: boolean,
  attemptsCount: number,
  clearTimeMs: number | null
): UserStepProgress {
  const now = new Date().toISOString();
  
  if (!currentProgress) {
    return {
      id: "generate-uuid-in-db", // handled by DB/caller
      playSessionId: sessionId,
      stageStepId: stepId,
      unlocked: true,
      cleared: isClear,
      bestAttemptsCount: isClear ? attemptsCount : null,
      bestClearTimeMs: isClear ? clearTimeMs : null,
      clearsCount: isClear ? 1 : 0,
      failuresCount: isClear ? 0 : 1,
      seenPuzzleIds: [puzzleId],
      firstClearedAt: isClear ? now : null,
      lastPlayedAt: now,
    };
  }

  const seenSet = new Set(currentProgress.seenPuzzleIds);
  seenSet.add(puzzleId);

  let newBestAttempts = currentProgress.bestAttemptsCount;
  let newBestTime = currentProgress.bestClearTimeMs;

  if (isClear) {
    if (newBestAttempts === null || attemptsCount < newBestAttempts) {
      newBestAttempts = attemptsCount;
    }
    if (newBestTime === null || (clearTimeMs !== null && clearTimeMs < newBestTime)) {
      newBestTime = clearTimeMs;
    }
  }

  return {
    ...currentProgress,
    cleared: currentProgress.cleared || isClear, // once cleared, always cleared
    bestAttemptsCount: newBestAttempts,
    bestClearTimeMs: newBestTime,
    clearsCount: currentProgress.clearsCount + (isClear ? 1 : 0),
    failuresCount: currentProgress.failuresCount + (isClear ? 0 : 1),
    seenPuzzleIds: Array.from(seenSet),
    firstClearedAt: currentProgress.firstClearedAt || (isClear ? now : null),
    lastPlayedAt: now,
  };
}
