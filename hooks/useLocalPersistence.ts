/**
 * hooks/useLocalPersistence.ts
 *
 * Manages game state persistence in localStorage.
 * Allows restoring an unfinished game on page reload.
 */

"use client";

import { useCallback } from "react";
import type { LocalGameRecord, SessionStats } from "@/types/game";

const GAME_RECORD_PREFIX = "mathdle-game-";
const STATS_KEY = "mathdle-stats";

export function useLocalPersistence() {
  const saveGame = useCallback((record: LocalGameRecord) => {
    try {
      const key = `${GAME_RECORD_PREFIX}${record.puzzleId}-${record.mode}`;
      localStorage.setItem(key, JSON.stringify({ ...record, savedAt: Date.now() }));
    } catch {
      // localStorage may be unavailable (SSR, private browsing quotas)
    }
  }, []);

  const loadGame = useCallback(
    (puzzleId: string, mode: string): LocalGameRecord | null => {
      try {
        const key = `${GAME_RECORD_PREFIX}${puzzleId}-${mode}`;
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const record = JSON.parse(raw) as LocalGameRecord;
        // Discard saves older than 24h
        if (Date.now() - record.savedAt > 86_400_000) {
          localStorage.removeItem(key);
          return null;
        }
        return record;
      } catch {
        return null;
      }
    },
    []
  );

  const clearGame = useCallback((puzzleId: string, mode: string) => {
    try {
      const key = `${GAME_RECORD_PREFIX}${puzzleId}-${mode}`;
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, []);

  const loadStats = useCallback((): SessionStats => {
    const defaults: SessionStats = {
      totalGames: 0,
      totalWins: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: null,
      lastPlayedPuzzleId: null,
      distribution: {},
    };
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...(JSON.parse(raw) as Partial<SessionStats>) };
    } catch {
      return defaults;
    }
  }, []);

  const updateStats = useCallback(
    (update: (prev: SessionStats) => SessionStats) => {
      try {
        const defaults: SessionStats = {
          totalGames: 0,
          totalWins: 0,
          currentStreak: 0,
          maxStreak: 0,
          lastPlayedDate: null,
          lastPlayedPuzzleId: null,
          distribution: {},
        };
        const raw = localStorage.getItem(STATS_KEY);
        const prev = raw
          ? { ...defaults, ...(JSON.parse(raw) as Partial<SessionStats>) }
          : defaults;
        const next = update(prev);
        localStorage.setItem(STATS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    []
  );

  return { saveGame, loadGame, clearGame, loadStats, updateStats };
}
