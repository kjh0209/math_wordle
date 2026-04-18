"use client";

import { cn } from "@/lib/utils/cn";
import { TokenTile } from "./TokenTile";
import type { GuessRow } from "@/types/game";
import type { TileState } from "@/types/game";

interface AttemptRowProps {
  row?: GuessRow;
  tokenLength: number;
  isActive?: boolean;
  activeTokens?: { value: string; display: string }[];
  isInvalid?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AttemptRow({
  row,
  tokenLength,
  isActive = false,
  activeTokens = [],
  isInvalid = false,
  size = "md",
  className,
}: AttemptRowProps) {
  const tiles = Array.from({ length: tokenLength }, (_, i) => {
    // Submitted row
    if (row && row.status === "submitted") {
      const token = row.tokens[i];
      const feedback = row.feedback[i];
      const state: TileState =
        feedback === "correct"
          ? "correct"
          : feedback === "present"
          ? "present"
          : "absent";

      return (
        <TokenTile
          key={i}
          value={token?.value}
          display={token?.display}
          state={state}
          size={size}
          // Staggered flip reveal
          animationDelay={i * 120}
          className="tile-flip-reveal"
        />
      );
    }

    // Active input row
    if (isActive) {
      const token = activeTokens[i];
      const state: TileState = isInvalid
        ? "invalid"
        : token
        ? "active"
        : "empty";

      return (
        <TokenTile
          key={i}
          value={token?.value}
          display={token?.display}
          state={state}
          size={size}
          className={cn(token && !isInvalid && "tile-pop")}
        />
      );
    }

    // Empty future row
    return <TokenTile key={i} state="empty" size={size} />;
  });

  return (
    <div
      className={cn(
        "flex gap-1.5 justify-center",
        isInvalid && "tile-shake",
        className
      )}
      role="row"
    >
      {tiles}
    </div>
  );
}
