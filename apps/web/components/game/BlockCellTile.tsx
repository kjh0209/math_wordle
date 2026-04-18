"use client";

import { cn } from "@/lib/utils/cn";
import { getBlockDisplay } from "@mathdle/core";
import type { BlockCell } from "@mathdle/core";
import type { TileState } from "@/types/game";

interface BlockCellTileProps {
  cell: BlockCell;
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
  sm: "h-9 px-2 text-xs rounded-lg min-w-[2.5rem]",
  md: "h-12 px-2.5 text-sm rounded-xl min-w-[3rem]",
  lg: "h-14 px-3 text-sm rounded-xl min-w-[3.5rem]",
};

export function BlockCellTile({
  cell,
  state,
  size = "md",
  animationDelay,
  className,
}: BlockCellTileProps) {
  const display = getBlockDisplay(cell.blockType, cell.fields);
  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined;

  return (
    <div
      className={cn(
        "token-tile font-mono text-center flex items-center justify-center",
        SIZE_CLASSES[size],
        STATE_CLASSES[state],
        className
      )}
      style={style}
      aria-label={`Block: ${display}`}
      title={display}
    >
      <span className="truncate leading-none">{display}</span>
    </div>
  );
}

// ─── Block-specific decorative renderers ──────────────────────────────────────
// These are used in result/share views for richer display.

export function LogBaseBlock({ base }: { base: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5 font-mono">
      <span>log</span>
      <sub className="text-[0.7em]">{base}</sub>
      <span>()</span>
    </span>
  );
}

export function SigmaRangeBlock({ start, end }: { start: string; end: string }) {
  return (
    <span className="inline-flex flex-col items-center leading-none font-mono text-[0.8em]">
      <span className="text-[0.75em]">{end}</span>
      <span>Σ</span>
      <span className="text-[0.75em]">i={start}</span>
    </span>
  );
}

export function IntegralRangeBlock({ start, end }: { start: string; end: string }) {
  return (
    <span className="inline-flex flex-col items-center leading-none font-mono text-[0.8em]">
      <span className="text-[0.75em]">{end}</span>
      <span className="text-lg">∫</span>
      <span className="text-[0.75em]">{start}</span>
    </span>
  );
}

export function DxBlock() {
  return <span className="font-mono font-italic">dx</span>;
}

export function CombBlock({ n, r }: { n: string; r: string }) {
  return (
    <span className="font-mono">
      {n}C{r}
    </span>
  );
}

export function PermBlock({ n, r }: { n: string; r: string }) {
  return (
    <span className="font-mono">
      {n}P{r}
    </span>
  );
}
