"use client";

import { cn } from "@/lib/utils/cn";
import { Trophy, Clock, Target } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LeaderboardEntry, LeaderboardStats } from "@/types/leaderboard";
import { formatTime } from "@/lib/utils/session";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  stats: LeaderboardStats;
  className?: string;
}

const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];

export function LeaderboardTable({ entries, stats, className }: LeaderboardTableProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Trophy className="w-4 h-4 text-yellow-400" />}
          label="총 참여자"
          value={String(stats.totalPlayers)}
        />
        <StatCard
          icon={<Target className="w-4 h-4 text-green-400" />}
          label="클리어"
          value={String(stats.totalClears)}
        />
        <StatCard
          icon={<Clock className="w-4 h-4 text-blue-400" />}
          label="최고 기록"
          value={stats.bestTimeMs != null ? formatTime(stats.bestTimeMs) : "-"}
        />
        <StatCard
          icon={<Trophy className="w-4 h-4 text-brand" />}
          label="최소 시도"
          value={stats.bestAttemptsCount != null ? `${stats.bestAttemptsCount}회` : "-"}
        />
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <EmptyState
          title="아직 기록이 없습니다"
          description="첫 번째 플레이어가 되어보세요!"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <LeaderboardRow key={`${entry.sessionId}-${entry.clearedAt}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const rankColor = RANK_COLORS[entry.rank - 1] ?? "text-game-text-muted";
  const rankIcon = RANK_ICONS[entry.rank - 1];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-game-card border border-game-border",
        entry.rank === 1 && "border-yellow-700/50 bg-yellow-900/10"
      )}
    >
      {/* Rank */}
      <div className={cn("w-8 text-center font-bold text-sm", rankColor)}>
        {rankIcon ?? `#${entry.rank}`}
      </div>

      {/* Player name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-game-text truncate">
          {entry.displayName}
        </p>
        <p className="text-xs text-game-muted">
          {new Date(entry.clearedAt).toLocaleDateString("ko-KR")}
        </p>
      </div>

      {/* Attempts */}
      <div className="text-right">
        <p className="text-sm font-bold font-mono-game text-game-text">
          {entry.attemptsCount}회
        </p>
        <p className="text-xs text-game-muted">{formatTime(entry.clearTimeMs)}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-game-card border border-game-border">
      {icon}
      <span className="text-lg font-bold font-mono-game text-game-text">{value}</span>
      <span className="text-xs text-game-text-muted">{label}</span>
    </div>
  );
}
