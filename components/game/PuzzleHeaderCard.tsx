import { Calendar, Tag, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PuzzleStatusBadge } from "@/components/ui/PuzzleStatusBadge";
import type { PuzzleViewModel } from "@/types/puzzle";

interface PuzzleHeaderCardProps {
  puzzle: PuzzleViewModel;
  attemptCount: number;
  className?: string;
}

export function PuzzleHeaderCard({
  puzzle,
  attemptCount,
  className,
}: PuzzleHeaderCardProps) {
  const contextEntries = puzzle.displayInfo.context
    ? Object.entries(puzzle.displayInfo.context)
    : [];

  return (
    <div
      className={cn(
        "glass-card p-4",
        className
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-xl font-bold text-game-text leading-tight">
            {puzzle.title}
          </h2>
          {puzzle.displayInfo.subtitle && (
            <p className="text-sm text-game-text-muted mt-0.5">
              {puzzle.displayInfo.subtitle}
            </p>
          )}
        </div>
        <PuzzleStatusBadge difficulty={puzzle.difficulty} />
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        {puzzle.isDaily && puzzle.dailyDate && (
          <MetaChip icon={<Calendar className="w-3 h-3" />}>
            Daily · {formatDate(puzzle.dailyDate)}
          </MetaChip>
        )}
        {puzzle.category && (
          <MetaChip icon={<Tag className="w-3 h-3" />}>
            {puzzle.category}
          </MetaChip>
        )}
        <MetaChip icon={<Zap className="w-3 h-3" />}>
          {attemptCount}/{puzzle.maxAttempts}회 시도
        </MetaChip>

        {/* Variable context */}
        {contextEntries.map(([key, val]) => (
          <MetaChip key={key}>
            {key} = {val === "?" ? <span className="text-brand font-bold">?</span> : val}
          </MetaChip>
        ))}
      </div>

      {/* Hint */}
      {puzzle.displayInfo.hint && (
        <p className="mt-3 text-sm text-game-text-muted italic leading-relaxed border-t border-game-border pt-3">
          💡 {puzzle.displayInfo.hint}
        </p>
      )}
    </div>
  );
}

function MetaChip({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-game-card border border-game-border text-game-text-muted">
      {icon}
      {children}
    </span>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
