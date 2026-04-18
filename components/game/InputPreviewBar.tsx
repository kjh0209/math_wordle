"use client";

import { cn } from "@/lib/utils/cn";
import type { TokenUnit } from "@/types/puzzle";

interface InputPreviewBarProps {
  tokens: TokenUnit[];
  maxLength: number;
  onDelete?: () => void;
  className?: string;
}

export function InputPreviewBar({
  tokens,
  maxLength,
  onDelete,
  className,
}: InputPreviewBarProps) {
  const remaining = maxLength - tokens.length;

  return (
    <div
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2.5",
        "bg-game-card border border-game-border rounded-xl",
        "overflow-x-auto",
        className
      )}
    >
      {/* Token chips */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {tokens.map((t, i) => (
          <span
            key={i}
            className={cn(
              "inline-flex items-center justify-center",
              "min-w-[1.75rem] h-7 px-1.5",
              "rounded-md bg-brand/20 border border-brand/40",
              "font-mono-game text-sm font-semibold text-brand",
              "select-none"
            )}
          >
            {t.display}
          </span>
        ))}
      </div>

      {/* Cursor blink */}
      {tokens.length < maxLength && (
        <span className="flex-shrink-0 w-0.5 h-5 bg-brand/80 rounded-full animate-pulse" />
      )}

      {/* Remaining placeholder */}
      <span className="ml-auto flex-shrink-0 text-xs text-game-muted tabular-nums">
        {remaining > 0 ? `${remaining} 남음` : "가득 참"}
      </span>
    </div>
  );
}
