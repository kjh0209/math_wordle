"use client";

import { cn } from "@/lib/utils/cn";
import type { TileState } from "@/types/game";

interface TokenTileProps {
  value?: string;
  display?: string;
  state: TileState;
  size?: "sm" | "md" | "lg";
  animationDelay?: number;
  className?: string;
}

const STATE_CLASSES: Record<TileState, string> = {
  empty: "token-tile-empty",
  active: "token-tile-active",
  correct: "token-tile-correct",
  present: "token-tile-present",
  absent: "token-tile-absent",
  invalid: "token-tile-active tile-shake",
  revealing: "token-tile-correct tile-flip-reveal",
  pending: "token-tile-active opacity-70",
};

const SIZE_CLASSES = {
  sm: "w-9 h-9 text-sm rounded-lg",
  md: "w-12 h-12 text-lg rounded-xl",
  lg: "w-14 h-14 text-xl rounded-xl",
};

export function TokenTile({
  value,
  display,
  state,
  size = "md",
  animationDelay,
  className,
}: TokenTileProps) {
  const stateClass = STATE_CLASSES[state];
  const sizeClass = SIZE_CLASSES[size];

  const style = animationDelay !== undefined
    ? { animationDelay: `${animationDelay}ms` }
    : undefined;

  return (
    <div
      className={cn("token-tile", sizeClass, stateClass, className)}
      style={style}
      aria-label={value ? `Token: ${value}` : "Empty tile"}
    >
      {display ?? value ?? ""}
    </div>
  );
}
