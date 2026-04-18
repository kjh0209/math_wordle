"use client";

import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PuzzleStatusBadge } from "@/components/ui/PuzzleStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PuzzleSummary } from "@/types/puzzle";

interface AdminPuzzleTableProps {
  puzzles: PuzzleSummary[];
  className?: string;
}

export function AdminPuzzleTable({ puzzles, className }: AdminPuzzleTableProps) {
  if (puzzles.length === 0) {
    return (
      <EmptyState
        title="퍼즐이 없습니다"
        description="첫 번째 퍼즐을 생성해보세요."
        action={
          <Link
            href="/admin/puzzles/new"
            className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            퍼즐 생성
          </Link>
        }
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Header */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-game-muted uppercase tracking-wider">
        <span className="col-span-5">제목</span>
        <span className="col-span-2">레벨</span>
        <span className="col-span-2">난이도</span>
        <span className="col-span-2">데일리</span>
        <span className="col-span-1" />
      </div>

      {puzzles.map((puzzle) => (
        <PuzzleRow key={puzzle.id} puzzle={puzzle} />
      ))}
    </div>
  );
}

function PuzzleRow({ puzzle }: { puzzle: PuzzleSummary }) {
  return (
    <Link
      href={`/admin/puzzles/${puzzle.id}`}
      className={cn(
        "grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl",
        "bg-game-card border border-game-border",
        "hover:border-brand/40 hover:bg-brand/5 transition-colors group"
      )}
    >
      {/* Title */}
      <div className="col-span-10 sm:col-span-5 min-w-0">
        <p className="text-sm font-medium text-game-text truncate">{puzzle.title}</p>
        <p className="text-xs text-game-muted">{puzzle.category ?? "미분류"}</p>
      </div>

      {/* Level */}
      <div className="hidden sm:block col-span-2">
        <span className="text-xs text-game-text-muted">{puzzle.level.replace(/_/g, " ")}</span>
      </div>

      {/* Difficulty */}
      <div className="hidden sm:block col-span-2">
        <PuzzleStatusBadge difficulty={puzzle.difficulty} />
      </div>

      {/* Daily */}
      <div className="hidden sm:flex col-span-2 items-center gap-1">
        {puzzle.isDaily ? (
          <>
            <Calendar className="w-3.5 h-3.5 text-brand" />
            <span className="text-xs text-brand">{puzzle.dailyDate}</span>
          </>
        ) : (
          <span className="text-xs text-game-muted">-</span>
        )}
      </div>

      {/* Arrow */}
      <div className="col-span-2 sm:col-span-1 flex justify-end">
        <ChevronRight className="w-4 h-4 text-game-muted group-hover:text-brand transition-colors" />
      </div>
    </Link>
  );
}
