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
  activeCells?: PuzzleCell[];
  isInvalid?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  pathPrefix?: (string | number)[];
  focusedPath?: (string | number)[] | null;
  setFocusedPath?: (path: (string | number)[] | null) => void;
}

export function AttemptRow({
  row,
  answerLength,
  isActive = false,
  activeCells = [],
  isInvalid = false,
  size = "md",
  className,
  pathPrefix = [],
  focusedPath = null,
  setFocusedPath,
}: AttemptRowProps) {
  const tiles = Array.from({ length: answerLength }, (_, i) => {
    const currentPath = [...pathPrefix, i];
    const isFocused = focusedPath && JSON.stringify(focusedPath) === JSON.stringify(currentPath);

    // ── Submitted row ──────────────────────────────────────────────────────────
    if (row && row.status === "submitted") {
      const cell = row.cells[i];
      const feedbackObj = row.feedback[i];
      
      // Backward compat handling for string-based feedback or new NestedFeedback
      const feedbackColor = typeof feedbackObj === "string" ? feedbackObj : feedbackObj?.color;
      const state: TileState =
        feedbackColor === "correct" ? "correct" : feedbackColor === "present" ? "present" : "absent";

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
            nestedFeedback={typeof feedbackObj === "string" ? undefined : feedbackObj}
            pathPrefix={currentPath}
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
      const baseState: TileState = isInvalid ? "invalid" : cell ? "active" : "empty";
      
      // If we are placing the root token, highlighting the empty box.
      const state = (isFocused || (!focusedPath && i === activeCells.length)) ? "pending" : baseState;

      if (!cell) {
        return (
          <div key={i} onClick={() => setFocusedPath?.(null)} className="cursor-pointer">
            <TokenTile state={state} size={size} />
          </div>
        );
      }

      if (cell.type === "block") {
        return (
          <BlockCellTile
            key={i}
            cell={cell}
            state={state}
            size={size}
            className={cn(!isInvalid && "tile-pop")}
            pathPrefix={currentPath}
            focusedPath={focusedPath}
            setFocusedPath={setFocusedPath}
          />
        );
      }

      return (
        <div key={i} onClick={() => setFocusedPath?.(currentPath)} className="cursor-pointer">
          <TokenTile
            value={cell.value}
            display={getTokenDisplay(cell.value)}
            state={state}
            size={size}
            className={cn(!isInvalid && "tile-pop", isFocused && "ring-2 ring-primary")}
          />
        </div>
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
