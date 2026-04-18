/**
 * apps/mobile — useLeaderboard
 * Fetches leaderboard data via the shared API client.
 */

import { useState, useEffect, useCallback } from "react";
import { fetchLeaderboard } from "@mathdle/core";
import type { LeaderboardFilter, LeaderboardResponse } from "@mathdle/core";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: LeaderboardResponse }
  | { status: "error"; message: string };

export function useLeaderboard(
  puzzleId: string,
  initialFilter: LeaderboardFilter = "today",
) {
  const [filter, setFilter] = useState<LeaderboardFilter>(initialFilter);
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });

  const doFetch = useCallback(
    async (pId: string, f: LeaderboardFilter) => {
      setLoadState({ status: "loading" });
      try {
        const data = await fetchLeaderboard(pId, f);
        setLoadState({ status: "ready", data });
      } catch {
        setLoadState({
          status: "error",
          message: "리더보드를 불러오지 못했습니다.",
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (puzzleId) void doFetch(puzzleId, filter);
  }, [puzzleId, filter, doFetch]);

  const changeFilter = useCallback(
    (f: LeaderboardFilter) => setFilter(f),
    [],
  );
  const refresh = useCallback(
    () => doFetch(puzzleId, filter),
    [puzzleId, filter, doFetch],
  );

  return { loadState, filter, changeFilter, refresh };
}
