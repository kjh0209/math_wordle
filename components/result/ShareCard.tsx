"use client";

import { Copy, Check, Share2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useShareResult } from "@/hooks/useShareResult";
import type { PuzzleViewModel } from "@/types/puzzle";
import type { FeedbackColor, GameMode } from "@/types/game";

interface ShareCardProps {
  puzzle: PuzzleViewModel;
  mode: GameMode;
  solved: boolean;
  attemptsUsed: number;
  clearTimeMs: number | null;
  rows: FeedbackColor[][];
  shareCode?: string;
  className?: string;
}

export function ShareCard({
  puzzle,
  mode,
  solved,
  attemptsUsed,
  clearTimeMs,
  rows,
  shareCode,
  className,
}: ShareCardProps) {
  const { shareState, copied, copyText, copyLink, nativeShare } = useShareResult({
    puzzle,
    mode,
    solved,
    attemptsUsed,
    clearTimeMs,
    rows,
    shareCode,
  });

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className={cn("rounded-xl bg-game-card border border-game-border overflow-hidden", className)}>
      {/* Emoji grid preview */}
      <div className="px-4 py-3 font-mono text-center text-lg leading-relaxed tracking-widest">
        {shareState.emojiGrid.split("\n").map((row, i) => (
          <div key={i}>{row}</div>
        ))}
      </div>

      {/* Text preview */}
      <div className="px-4 pb-3 text-xs text-game-text-muted font-mono whitespace-pre-wrap leading-relaxed border-t border-game-border pt-3">
        {shareState.text}
      </div>

      {/* Action buttons */}
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={copyText}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors",
            copied
              ? "bg-green-800/50 text-green-300 border border-green-700"
              : "bg-game-surface text-game-text-muted hover:text-game-text border border-game-border"
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "복사됨!" : "텍스트 복사"}
        </button>

        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-game-surface text-game-text-muted hover:text-game-text border border-game-border transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          링크 복사
        </button>

        {hasNativeShare && (
          <button
            onClick={() => void nativeShare()}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-brand/20 text-brand hover:bg-brand/30 border border-brand/40 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
