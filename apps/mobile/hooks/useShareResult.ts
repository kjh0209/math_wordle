/**
 * apps/mobile — useShareResult
 * Share game results via system share sheet and clipboard.
 */

import { useState, useCallback, useMemo } from "react";
import { Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { PuzzleViewModel, FeedbackColor, GameMode, ShareState } from "@mathdle/core";
import { buildShareState, generateShareCode } from "@mathdle/core";

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

  // TODO: Replace with actual app URL when deployed
  const appUrl = "https://mathdle.app";

  const code = options.shareCode ?? generateShareCode(
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  const shareState: ShareState = useMemo(() => buildShareState({
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
  }), [options.puzzle.id, options.solved, options.attemptsUsed, code]);

  const copyText = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(shareState.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [shareState.text]);

  const nativeShare = useCallback(async () => {
    try {
      await Share.share({
        message: shareState.text,
      });
    } catch {
      // user cancelled or error
    }
  }, [shareState.text]);

  return { shareState, copied, copyText, nativeShare };
}
