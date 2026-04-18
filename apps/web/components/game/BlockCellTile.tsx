"use client";

import { cn } from "@/lib/utils/cn";
import { getTokenDisplay } from "@mathdle/core";
import type { BlockCell, PuzzleCell } from "@mathdle/core";
import type { TileState, NestedFeedback } from "@/types/game";

interface BlockCellTileProps {
  cell: BlockCell;
  state: TileState;
  size?: "sm" | "md" | "lg";
  animationDelay?: number;
  className?: string;
  nestedFeedback?: NestedFeedback;
  pathPrefix?: (string | number)[];
  focusedPath?: (string | number)[] | null;
  setFocusedPath?: (path: (string | number)[] | null) => void;
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
  sm: "px-1.5 text-xs rounded-lg",
  md: "px-2 text-sm rounded-xl",
  lg: "px-2.5 text-sm rounded-xl",
};

// Little Helper to render a token directly
function SmallTokenTile({ c, feedback, isFocused, onClick }: { c?: PuzzleCell; feedback?: string; isFocused: boolean; onClick: () => void }) {
  let bg = "bg-primary/10 text-primary-foreground"; // empty
  if (c) bg = "bg-primary/20 text-primary-foreground"; // active
  if (isFocused && !c) bg = "bg-primary/40 ring-1 ring-primary pulse";
  if (isFocused && c) bg += " ring-1 ring-primary";
  
  if (feedback === "correct") bg = "bg-green-500 text-white";
  else if (feedback === "present") bg = "bg-yellow-500 text-white";
  else if (feedback === "absent") bg = "bg-slate-700 text-white";
  
  const val = c?.type === "token" ? getTokenDisplay(c.value) : c?.type === "block" ? c.blockType : "";
  
  return (
    <span onClick={(e) => { e.stopPropagation(); onClick(); }} className={cn("inline-flex items-center justify-center min-w-[1.2em] min-h-[1.2em] rounded px-0.5 cursor-pointer", bg)}>
      {val || "\u00A0"}
    </span>
  );
}

export function BlockCellTile({
  cell,
  state,
  size = "md",
  animationDelay,
  className,
  nestedFeedback,
  pathPrefix = [],
  focusedPath = null,
  setFocusedPath,
}: BlockCellTileProps) {
  const style = animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined;

  const renderField = (fieldName: string) => {
    const fieldCells = cell.cellFields?.[fieldName] || [];
    const fieldsFeedback = nestedFeedback?.fields?.[fieldName] || [];
    
    // We always render at least one slot if empty, OR the cells + one empty slot at the end if focused inside?
    // For simplicity, just render the current cells, plus one extra slot if we are actively focused at the END of this field.
    const pathBase = [...pathPrefix, "fields", fieldName];
    
    const elements = fieldCells.map((fc, i) => {
       const curPath = [...pathBase, i];
       const isFoc = focusedPath && JSON.stringify(focusedPath) === JSON.stringify(curPath);
       const fb = fieldsFeedback[i];
       const colorStr = typeof fb === "string" ? fb : fb?.color;
       return <SmallTokenTile key={i} c={fc} feedback={colorStr} isFocused={!!isFoc} onClick={() => setFocusedPath?.(curPath)} />;
    });
    
    const nextIndex = fieldCells.length;
    const nextPath = [...pathBase, nextIndex];
    const isNextFoc = focusedPath && JSON.stringify(focusedPath) === JSON.stringify(nextPath);
    
    // Always show an empty trailing slot to allow appending
    if (setFocusedPath && (elements.length === 0 || isNextFoc || !focusedPath)) {
       elements.push(
         <SmallTokenTile key="empty" isFocused={!!isNextFoc} onClick={() => setFocusedPath?.(nextPath)} />
       );
    }
    
    return <span className="inline-flex gap-0.5">{elements}</span>;
  };

  const renderDecorative = () => {
    switch (cell.blockType) {
      case "LogBase":
        return (
          <span className="inline-flex items-baseline gap-0.5 font-mono">
            <span>log</span>
            <sub className="text-[0.7em]">{renderField("base")}</sub>
            <span>( )</span>
          </span>
        );
      case "SigmaRange":
        return (
          <span className="inline-flex flex-col items-center leading-none font-mono text-[0.8em]">
            <span className="text-[0.75em]">{renderField("end")}</span>
            <span>Σ</span>
            <span className="text-[0.75em] inline-flex items-center">i={renderField("start")}</span>
          </span>
        );
      case "IntegralRange":
        return (
          <span className="inline-flex flex-col items-center leading-none font-mono text-[0.8em]">
            <span className="text-[0.75em]">{renderField("end")}</span>
            <span className="text-lg">∫</span>
            <span className="text-[0.75em]">{renderField("start")}</span>
          </span>
        );
      case "dx":
        return <span className="font-mono italic">dx</span>;
      case "Comb":
        return (
          <span className="font-mono inline-flex items-center">
            {renderField("n")}C{renderField("r")}
          </span>
        );
      case "Perm":
        return (
          <span className="font-mono inline-flex items-center">
            {renderField("n")}P{renderField("r")}
          </span>
        );
      case "d/dx":
        return <span className="font-mono">d/dx</span>;
      default:
        return <span className="font-mono">{cell.blockType}</span>;
    }
  };

  return (
    <div
      className={cn(
        "token-tile font-mono text-center flex items-center justify-center p-2 min-h-12",
        SIZE_CLASSES[size],
        STATE_CLASSES[state],
        className
      )}
      style={style}
    >
      {renderDecorative()}
    </div>
  );
}
