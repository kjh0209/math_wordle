/**
 * apps/mobile — usePuzzleLoader
 *
 * Strategy:
 *  - If EXPO_PUBLIC_API_URL is set → fetch from the real API server
 *  - Otherwise → use local mock data instantly (no network, no wait)
 *
 * This means the app works out-of-the-box without a running Next.js server.
 */

import { useState, useEffect } from "react";
import {
  fetchTodaysPuzzle,
  fetchPuzzleById,
  fetchRandomPuzzle,
  configureApiBaseUrl,
  getMockDailyPuzzle,
  getMockRandomPuzzle,
  getMockPuzzleById,
  adaptPuzzle,
} from "@mathdle/core";
import type { PuzzleViewModel } from "@mathdle/core";

type LoadMode = "daily" | "random" | { id: string };

interface PuzzleLoaderState {
  puzzle: PuzzleViewModel | null;
  loading: boolean;
  error: string | null;
  usingMock: boolean;
  reload: () => void;
}

// Configure API base URL once at module level
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
if (API_URL) configureApiBaseUrl(API_URL);

function loadMock(mode: LoadMode): PuzzleViewModel | null {
  if (mode === "daily") {
    const t = getMockDailyPuzzle();
    return t ? adaptPuzzle(t) : null;
  }
  if (mode === "random") {
    return adaptPuzzle(getMockRandomPuzzle());
  }
  const t = getMockPuzzleById(mode.id);
  return t ? adaptPuzzle(t) : null;
}

export function usePuzzleLoader(mode: LoadMode = "daily"): PuzzleLoaderState {
  const [puzzle, setPuzzle] = useState<PuzzleViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((n) => n + 1);

  const modeKey = typeof mode === "object" ? mode.id : mode;

  useEffect(() => {
    // No API URL configured → use local mock data immediately (0 ms)
    if (!API_URL) {
      const mock = loadMock(mode);
      setPuzzle(mock);
      setLoading(false);
      setError(mock ? null : "해당 퍼즐을 찾을 수 없습니다.");
      return;
    }

    // API URL configured → fetch from server
    let cancelled = false;
    setLoading(true);
    setError(null);

    const doFetch = async () => {
      try {
        let result: PuzzleViewModel;
        if (mode === "daily") {
          result = await fetchTodaysPuzzle();
        } else if (mode === "random") {
          result = await fetchRandomPuzzle();
        } else {
          result = await fetchPuzzleById(mode.id);
        }
        if (!cancelled) setPuzzle(result);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "퍼즐을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doFetch();
    return () => {
      cancelled = true;
    };
  }, [tick, modeKey]);

  return { puzzle, loading, error, usingMock: !API_URL, reload };
}
