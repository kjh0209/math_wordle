"use client";

import { cn } from "@/lib/utils/cn";
import { getTokenDisplay, getBlockDisplay } from "@mathdle/core";
import type { PuzzleCell } from "@/types/puzzle";

interface InputPreviewBarProps {
  cells: PuzzleCell[];
  maxLength: number;
  className?: string;
}

export function InputPreviewBar({ cells, maxLength, className }: InputPreviewBarProps) {
  const remaining = maxLength - cells.length;

  return (
    <div
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2.5",
        "bg-game-card border border-game-border rounded-xl",
        "overflow-x-auto",
        className
      )}
    >
      <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
        {cells.map((cell, i) => {
          const display =
            cell.type === "token"
              ? getTokenDisplay(cell.value)
              : getBlockDisplay(cell.blockType, cell.fields);

          return (
            <span
              key={i}
              className={cn(
                "inline-flex items-center justify-center",
                "h-7 px-2 min-w-[1.75rem]",
                "rounded-md bg-brand/20 border border-brand/40",
                "font-mono text-sm font-semibold text-brand",
                "select-none whitespace-nowrap"
              )}
            >
              {display}
            </span>
          );
        })}
      </div>

      {cells.length < maxLength && (
        <span className="flex-shrink-0 w-0.5 h-5 bg-brand/80 rounded-full animate-pulse" />
      )}

      <span className="ml-auto flex-shrink-0 text-xs text-game-muted tabular-nums">
        {remaining > 0 ? `${remaining} 남음` : "가득 참"}
      </span>
    </div>
  );
}
