/**
 * apps/mobile — useLocalPersistence
 * Persist / restore game state and session stats with AsyncStorage.
 */

import { useCallback } from "react";
import { asyncStorageAdapter } from "../storage/async-storage-adapter";
import { getJSON, setJSON } from "@mathdle/core";
import type { LocalGameRecord, SessionStats } from "@mathdle/core";

const GAME_KEY = (puzzleId: string) => `mathdle:game:${puzzleId}`;
const STATS_KEY = "mathdle:stats";
const SESSION_KEY = "mathdle:session";

export function useLocalPersistence() {
  const loadGame = useCallback(
    (puzzleId: string): Promise<LocalGameRecord | null> =>
      getJSON<LocalGameRecord>(asyncStorageAdapter, GAME_KEY(puzzleId)),
    []
  );

  const saveGame = useCallback(
    (record: LocalGameRecord): Promise<void> =>
      setJSON(asyncStorageAdapter, GAME_KEY(record.puzzleId), record),
    []
  );

  const clearGame = useCallback(
    (puzzleId: string): Promise<void> =>
      asyncStorageAdapter.removeItem(GAME_KEY(puzzleId)),
    []
  );

  const loadStats = useCallback(
    (): Promise<SessionStats | null> =>
      getJSON<SessionStats>(asyncStorageAdapter, STATS_KEY),
    []
  );

  const saveStats = useCallback(
    (stats: SessionStats): Promise<void> =>
      setJSON(asyncStorageAdapter, STATS_KEY, stats),
    []
  );

  const getOrCreateSessionKey = useCallback(async (): Promise<string> => {
    const existing = await asyncStorageAdapter.getItem(SESSION_KEY);
    if (existing) return existing;
    const newKey = `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await asyncStorageAdapter.setItem(SESSION_KEY, newKey);
    return newKey;
  }, []);

  return { loadGame, saveGame, clearGame, loadStats, saveStats, getOrCreateSessionKey };
}
