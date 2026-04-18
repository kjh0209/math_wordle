/**
 * hooks/useLeaderboard.ts
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeaderboardFilter, LeaderboardResponse } from "@/types/leaderboard";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: LeaderboardResponse }
  | { status: "error"; message: string };

export function useLeaderboard(puzzleId: string, initialFilter: LeaderboardFilter = "today") {
  const [filter, setFilter] = useState<LeaderboardFilter>(initialFilter);
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });

  const fetch_ = useCallback(
    async (pId: string, f: LeaderboardFilter) => {
      setLoadState({ status: "loading" });
      try {
        const res = await fetch(`/api/leaderboard?puzzleId=${pId}&filter=${f}`);
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data = (await res.json()) as LeaderboardResponse;
        setLoadState({ status: "ready", data });
      } catch {
        setLoadState({ status: "error", message: "리더보드를 불러오지 못했습니다." });
      }
    },
    []
  );

  useEffect(() => {
    if (puzzleId) void fetch_(puzzleId, filter);
  }, [puzzleId, filter, fetch_]);

  const changeFilter = useCallback((f: LeaderboardFilter) => setFilter(f), []);
  const refresh = useCallback(() => fetch_(puzzleId, filter), [puzzleId, filter, fetch_]);

  return { loadState, filter, changeFilter, refresh };
}
