"use client";

import { cn } from "@/lib/utils/cn";
import { AttemptRow } from "./AttemptRow";
import type { GuessRow } from "@/types/game";
import type { PuzzleCell } from "@/types/puzzle";

interface AttemptGridProps {
  answerLength: number;
  maxAttempts: number;
  rows: GuessRow[];
  currentCells: PuzzleCell[];
  isInvalid?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AttemptGrid({
  answerLength,
  maxAttempts,
  rows,
  currentCells,
  isInvalid = false,
  size = "md",
  className,
}: AttemptGridProps) {
  const submittedRows = rows.filter((r) => r.status === "submitted");
  const activeIndex = submittedRows.length;
  const emptyCount = Math.max(0, maxAttempts - submittedRows.length - 1);

  return (
    <div
      className={cn("flex flex-col gap-1.5", className)}
      role="grid"
      aria-label="Guess grid"
    >
      {submittedRows.map((row, i) => (
        <AttemptRow key={i} row={row} answerLength={answerLength} size={size} />
      ))}

      {activeIndex < maxAttempts && (
        <AttemptRow
          answerLength={answerLength}
          isActive
          activeCells={currentCells}
          isInvalid={isInvalid}
          size={size}
        />
      )}

      {Array.from({ length: emptyCount }, (_, i) => (
        <AttemptRow key={`empty-${i}`} answerLength={answerLength} size={size} />
      ))}
    </div>
  );
}
