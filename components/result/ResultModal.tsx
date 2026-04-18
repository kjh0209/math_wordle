"use client";

import { useEffect } from "react";
import { X, Trophy, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { ShareCard } from "./ShareCard";
import type { PuzzleViewModel } from "@/types/puzzle";
import type { FeedbackColor, GameMode } from "@/types/game";
import { formatTime } from "@/lib/utils/session";

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: PuzzleViewModel;
  mode: GameMode;
  solved: boolean;
  attemptCount: number;
  clearTimeMs: number | null;
  rows: FeedbackColor[][];
  shareCode?: string;
  onPlayAgain?: () => void;
}

export function ResultModal({
  isOpen,
  onClose,
  puzzle,
  mode,
  solved,
  attemptCount,
  clearTimeMs,
  rows,
  shareCode,
  onPlayAgain,
}: ResultModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full max-w-md",
          "glass-card p-6",
          "animate-fade-in-up"
        )}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-game-text-muted hover:text-game-text hover:bg-game-card transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Result header */}
        <div className="text-center mb-6">
          {solved ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold text-game-text">정답!</h2>
              <p className="text-game-text-muted mt-1">
                {attemptCount}번 만에 맞혔습니다
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">😔</div>
              <h2 className="text-2xl font-bold text-game-text">아깝네요</h2>
              <p className="text-game-text-muted mt-1">
                다음엔 꼭 맞출 수 있을 거예요!
              </p>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox label="시도" value={`${attemptCount}/${puzzle.maxAttempts}`} />
          <StatBox
            label="시간"
            value={clearTimeMs != null ? formatTime(clearTimeMs) : "-"}
          />
          <StatBox
            label="모드"
            value={
              mode === "daily" ? "데일리" : mode === "practice" ? "연습" : "공유"
            }
          />
        </div>

        {/* Explanation */}
        {puzzle.explanation && (
          <div className="mb-5 p-3 rounded-xl bg-game-card border border-game-border">
            <p className="text-xs text-game-text-muted font-medium mb-1">해설</p>
            <p className="text-sm text-game-text">{puzzle.explanation}</p>
          </div>
        )}

        {/* Share card */}
        <ShareCard
          puzzle={puzzle}
          mode={mode}
          solved={solved}
          attemptsUsed={attemptCount}
          clearTimeMs={clearTimeMs}
          rows={rows}
          shareCode={shareCode}
          className="mb-4"
        />

        {/* Actions */}
        <div className="flex gap-2">
          {onPlayAgain ? (
            <button
              onClick={onPlayAgain}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-game-card border border-game-border text-game-text hover:bg-game-border transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              다시 시작
            </button>
          ) : null}
          <Link
            href="/play?mode=practice"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand/20 border border-brand/40 text-brand hover:bg-brand/30 transition-colors text-sm font-medium"
          >
            연습 모드
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-game-card border border-game-border">
      <span className="text-lg font-bold text-game-text font-mono-game">{value}</span>
      <span className="text-xs text-game-text-muted mt-0.5">{label}</span>
    </div>
  );
}
