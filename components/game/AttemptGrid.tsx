"use client";

import { cn } from "@/lib/utils/cn";
import { AttemptRow } from "./AttemptRow";
import type { GuessRow } from "@/types/game";
import type { TokenUnit } from "@/types/puzzle";

interface AttemptGridProps {
  tokenLength: number;
  maxAttempts: number;
  rows: GuessRow[];
  currentTokens: TokenUnit[];
  isInvalid?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AttemptGrid({
  tokenLength,
  maxAttempts,
  rows,
  currentTokens,
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
      {/* Submitted rows */}
      {submittedRows.map((row, i) => (
        <AttemptRow
          key={i}
          row={row}
          tokenLength={tokenLength}
          size={size}
        />
      ))}

      {/* Active input row (if game still in progress) */}
      {activeIndex < maxAttempts && (
        <AttemptRow
          tokenLength={tokenLength}
          isActive
          activeTokens={currentTokens}
          isInvalid={isInvalid}
          size={size}
        />
      )}

      {/* Empty future rows */}
      {Array.from({ length: emptyCount }, (_, i) => (
        <AttemptRow key={`empty-${i}`} tokenLength={tokenLength} size={size} />
      ))}
    </div>
  );
}
