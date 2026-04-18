"use client";

import { cn } from "@/lib/utils/cn";
import { TokenTile } from "./TokenTile";
import { BlockCellTile } from "./BlockCellTile";
import { getTokenDisplay } from "@mathdle/core";
import type { GuessRow } from "@/types/game";
import type { PuzzleCell } from "@/types/puzzle";
import type { TileState } from "@/types/game";

interface AttemptRowProps {
  row?: GuessRow;
  answerLength: number;
  isActive?: boolean;
  /** Cells being built for the current active row */
  activeCells?: PuzzleCell[];
  isInvalid?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AttemptRow({
  row,
  answerLength,
  isActive = false,
  activeCells = [],
  isInvalid = false,
  size = "md",
  className,
}: AttemptRowProps) {
  const tiles = Array.from({ length: answerLength }, (_, i) => {
    // ── Submitted row ──────────────────────────────────────────────────────────
    if (row && row.status === "submitted") {
      const cell = row.cells[i];
      const feedback = row.feedback[i];
      const state: TileState =
        feedback === "correct" ? "correct" : feedback === "present" ? "present" : "absent";

      if (!cell) return <TokenTile key={i} state="empty" size={size} />;

      if (cell.type === "block") {
        return (
          <BlockCellTile
            key={i}
            cell={cell}
            state={state}
            size={size}
            animationDelay={i * 120}
            className="tile-flip-reveal"
          />
        );
      }

      return (
        <TokenTile
          key={i}
          value={cell.value}
          display={getTokenDisplay(cell.value)}
          state={state}
          size={size}
          animationDelay={i * 120}
          className="tile-flip-reveal"
        />
      );
    }

    // ── Active input row ───────────────────────────────────────────────────────
    if (isActive) {
      const cell = activeCells[i];
      const state: TileState = isInvalid ? "invalid" : cell ? "active" : "empty";

      if (!cell) return <TokenTile key={i} state={state} size={size} />;

      if (cell.type === "block") {
        return (
          <BlockCellTile
            key={i}
            cell={cell}
            state={state}
            size={size}
            className={cn(!isInvalid && "tile-pop")}
          />
        );
      }

      return (
        <TokenTile
          key={i}
          value={cell.value}
          display={getTokenDisplay(cell.value)}
          state={state}
          size={size}
          className={cn(!isInvalid && "tile-pop")}
        />
      );
    }

    // ── Empty future row ───────────────────────────────────────────────────────
    return <TokenTile key={i} state="empty" size={size} />;
  });

  return (
    <div
      className={cn(
        "flex gap-1.5 justify-center flex-wrap",
        isInvalid && "tile-shake",
        className
      )}
      role="row"
    >
      {tiles}
    </div>
  );
}
