/**
 * hooks/usePuzzleLoader.ts
 *
 * Fetches a puzzle from the API and returns it as a PuzzleViewModel.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { PuzzleViewModel } from "@/types/puzzle";

type LoaderState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; puzzle: PuzzleViewModel }
  | { status: "error"; message: string };

export function usePuzzleLoader(puzzleId?: string) {
  const [state, setState] = useState<LoaderState>({ status: "idle" });

  const load = useCallback(async (id?: string) => {
    setState({ status: "loading" });
    try {
      const url = id
        ? `/api/puzzles/${id}`
        : "/api/puzzles/today";
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setState({ status: "error", message: (err as { error: string }).error ?? "퍼즐을 불러오지 못했습니다." });
        return;
      }
      const data = await res.json() as { puzzle: PuzzleViewModel };
      setState({ status: "ready", puzzle: data.puzzle });
    } catch {
      setState({ status: "error", message: "네트워크 오류가 발생했습니다." });
    }
  }, []);

  useEffect(() => {
    void load(puzzleId);
  }, [load, puzzleId]);

  return {
    ...state,
    reload: () => load(puzzleId),
  };
}
