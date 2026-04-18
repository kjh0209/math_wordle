/**
 * hooks/useShareResult.ts
 *
 * Handles share text generation and clipboard copy.
 */

"use client";

import { useState, useCallback } from "react";
import type { PuzzleViewModel } from "@/types/puzzle";
import type { FeedbackColor, GameMode } from "@/types/game";
import type { ShareState } from "@/types/share";
import { buildShareState, generateShareCode } from "@/lib/game/share";

interface UseShareResultOptions {
  puzzle: PuzzleViewModel;
  mode: GameMode;
  solved: boolean;
  attemptsUsed: number;
  clearTimeMs: number | null;
  rows: FeedbackColor[][];
  shareCode?: string;
}

export function useShareResult(options: UseShareResultOptions) {
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  const code = options.shareCode ?? generateShareCode(crypto.randomUUID());

  const shareState: ShareState = buildShareState({
    puzzleId: options.puzzle.id,
    puzzleTitle: options.puzzle.title,
    mode: options.mode,
    solved: options.solved,
    attemptsUsed: options.attemptsUsed,
    maxAttempts: options.puzzle.maxAttempts,
    clearTimeMs: options.clearTimeMs,
    rows: options.rows,
    shareCode: code,
    appUrl,
  });

  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareState.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text from a textarea
    }
  }, [shareState.text]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareState.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [shareState.link]);

  const nativeShare = useCallback(async () => {
    if (!navigator.share) return false;
    try {
      await navigator.share({
        title: options.puzzle.title,
        text: shareState.text,
        url: shareState.link,
      });
      return true;
    } catch {
      return false;
    }
  }, [options.puzzle.title, shareState]);

  return { shareState, copied, copyText, copyLink, nativeShare };
}
