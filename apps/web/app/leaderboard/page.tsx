"use client";

import { useState } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { cn } from "@/lib/utils/cn";
import type { LeaderboardFilter } from "@/types/leaderboard";

const FILTERS: { value: LeaderboardFilter; label: string }[] = [
  { value: "today", label: "오늘" },
  { value: "all-time", label: "전체 기간" },
  { value: "practice", label: "연습 모드" },
];

// TODO: Make this dynamic (today's puzzle ID from API)
const DAILY_PUZZLE_ID = "daily-001";

export default function LeaderboardPage() {
  const [puzzleId] = useState(DAILY_PUZZLE_ID);
  const { loadState, filter, changeFilter, refresh } = useLeaderboard(puzzleId, "today");

  return (
    <div className="min-h-screen flex flex-col bg-game-bg text-game-text">
      <AppHeader />

      <main className="flex-1 max-w-sm mx-auto w-full px-4 pt-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-game-text">리더보드</h1>
            <p className="text-sm text-game-text-muted mt-0.5">
              오늘의 퍼즐 — 최고 기록
            </p>
          </div>
          <button
            onClick={refresh}
            className="text-xs text-game-text-muted hover:text-game-text px-3 py-1.5 rounded-lg hover:bg-game-card transition-colors"
          >
            새로고침
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-game-card rounded-xl border border-game-border mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => changeFilter(f.value)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                filter === f.value
                  ? "bg-brand text-white shadow-sm"
                  : "text-game-text-muted hover:text-game-text"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loadState.status === "loading" || loadState.status === "idle" ? (
          <LoadingState message="리더보드 불러오는 중..." />
        ) : loadState.status === "error" ? (
          <ErrorState
            message={loadState.message}
            action={
              <button
                onClick={refresh}
                className="px-4 py-2 rounded-xl bg-brand text-white text-sm"
              >
                다시 시도
              </button>
            }
          />
        ) : (
          <LeaderboardTable
            entries={loadState.data.entries}
            stats={loadState.data.stats}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
