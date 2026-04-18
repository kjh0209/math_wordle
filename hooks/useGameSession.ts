/**
 * hooks/useGameSession.ts
 *
 * Core game session hook. Manages the full game state machine:
 * loading → playing → win/lose
 *
 * Persists state to localStorage so unfinished games survive page refresh.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PuzzleViewModel, InputCell, TokenUnit } from "@/types/puzzle";
import type {
  GameState,
  GameStatus,
  GameMode,
  GuessRow,
  FeedbackColor,
  KeyboardState,
  ToastMessage,
  LocalGameRecord,
} from "@/types/game";
import { colorPriority } from "@/lib/game/validator";
import { useLocalPersistence } from "./useLocalPersistence";
import { getSessionKey } from "@/lib/utils/session";

interface UseGameSessionOptions {
  puzzle: PuzzleViewModel;
  mode: GameMode;
}

interface UseGameSessionReturn {
  state: GameState;
  keyboardState: KeyboardState;
  toast: ToastMessage | null;
  appendCell: (cell: InputCell) => void;
  deleteToken: () => void;
  clearInput: () => void;
  submitGuess: () => Promise<void>;
  dismissToast: () => void;
}

export function useGameSession({
  puzzle,
  mode,
}: UseGameSessionOptions): UseGameSessionReturn {
  const { saveGame, loadGame, clearGame, updateStats } = useLocalPersistence();

  const initState = useCallback((): GameState => {
    const saved = loadGame(puzzle.id, mode);
    if (saved && (saved.status === "playing")) {
      return {
        puzzleId: puzzle.id,
        mode,
        status: "playing",
        rows: saved.rows,
        currentTokens: saved.currentTokens,
        errorMessage: null,
        startedAt: saved.startedAt,
        completedAt: null,
        attemptCount: saved.rows.filter((r) => r.status === "submitted").length,
        maxAttempts: puzzle.maxAttempts,
        shareCode: null,
      };
    }
    return {
      puzzleId: puzzle.id,
      mode,
      status: "playing",
      rows: [],
      currentTokens: [],
      errorMessage: null,
      startedAt: Date.now(),
      completedAt: null,
      attemptCount: 0,
      maxAttempts: puzzle.maxAttempts,
      shareCode: null,
    };
  }, [puzzle, mode, loadGame]);

  const [state, setState] = useState<GameState>(initState);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore from saved state when puzzle changes
  useEffect(() => {
    setState(initState());
  }, [puzzle.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on state change
  useEffect(() => {
    if (state.status !== "playing") return;
    const record: LocalGameRecord = {
      puzzleId: state.puzzleId,
      mode: state.mode,
      status: "playing",
      rows: state.rows,
      currentTokens: state.currentTokens,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      savedAt: Date.now(),
    };
    saveGame(record);
  }, [state, saveGame]);

  // Keyboard state: best color seen for each token value
  const keyboardState = useMemo<KeyboardState>(() => {
    const ks: KeyboardState = {};
    for (const row of state.rows) {
      if (row.status !== "submitted") continue;
      row.tokens.forEach((token, i) => {
        const color = row.feedback[i];
        if (!color) return;
        const current = ks[token.value];
        if (!current || colorPriority(color) > colorPriority(current as FeedbackColor)) {
          ks[token.value] = color;
        }
      });
    }
    return ks;
  }, [state.rows]);

  const showToast = useCallback(
    (message: string, type: ToastMessage["type"] = "error", durationMs = 2500) => {
      const id = crypto.randomUUID();
      setToast({ id, type, message, durationMs });
      setTimeout(() => setToast((t) => (t?.id === id ? null : t)), durationMs);
    },
    []
  );

  const appendCell = useCallback(
    (cell: InputCell) => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.currentTokens.length >= puzzle.tokenLength) return prev;
        return { ...prev, currentTokens: [...prev.currentTokens, cell], errorMessage: null };
      });
    },
    [puzzle.tokenLength]
  );

  const deleteToken = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      return {
        ...prev,
        currentTokens: prev.currentTokens.slice(0, -1),
        errorMessage: null,
      };
    });
  }, []);

  const clearInput = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      return { ...prev, currentTokens: [], errorMessage: null };
    });
  }, []);

  const submitGuess = useCallback(async () => {
    if (isSubmitting) return;
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      if (prev.currentTokens.length < puzzle.tokenLength) {
        showToast(`${puzzle.tokenLength}칸을 모두 채워주세요.`);
        return prev;
      }
      return prev;
    });

    // Read current state synchronously
    const snap = { ...state };
    if (snap.status !== "playing") return;
    if (snap.currentTokens.length < puzzle.tokenLength) {
      showToast(`${puzzle.tokenLength}칸을 모두 채워주세요.`);
      return;
    }

    setIsSubmitting(true);

    const sessionKey = getSessionKey();

    try {
      const res = await fetch("/api/validate-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          cells: snap.currentTokens,
          sessionKey,
          attemptNumber: snap.attemptCount + 1,
          startTimeMs: snap.startedAt,
        }),
      });

      const data = await res.json() as {
        ok: boolean;
        feedback?: FeedbackColor[];
        solved?: boolean;
        gameOver?: boolean;
        message?: string;
        errorKind?: "syntax" | "eval";
      };

      if (!data.ok || !data.feedback) {
        showToast(data.message ?? "올바르지 않은 수식입니다.");
        // Shake the active row
        setState((prev) => {
          const rows = [...prev.rows];
          // find the active row or add a temporary invalid marker
          return { ...prev, errorMessage: data.message ?? "올바르지 않은 수식입니다." };
        });
        return;
      }

      const newRow: GuessRow = {
        tokens: snap.currentTokens,
        feedback: data.feedback,
        status: "submitted",
      };

      const nextAttemptCount = snap.attemptCount + 1;
      const won = data.solved ?? false;
      const lost = !won && (data.gameOver ?? nextAttemptCount >= puzzle.maxAttempts);

      let nextStatus: GameStatus = "playing";
      if (won) nextStatus = "win";
      else if (lost) nextStatus = "lose";

      setState((prev) => ({
        ...prev,
        rows: [...prev.rows, newRow],
        currentTokens: [],
        errorMessage: null,
        attemptCount: nextAttemptCount,
        status: nextStatus,
        completedAt: nextStatus !== "playing" ? Date.now() : null,
      }));

      if (nextStatus !== "playing") {
        // Clear saved game and update stats
        clearGame(puzzle.id, mode);
        updateStats((prev) => {
          const today = new Date().toISOString().split("T")[0];
          const lastDate = prev.lastPlayedDate;
          const isConsecutive =
            lastDate &&
            new Date(lastDate).getTime() >= Date.now() - 86_400_000;

          const newStreak = won
            ? isConsecutive
              ? prev.currentStreak + 1
              : 1
            : 0;

          const dist = { ...prev.distribution };
          if (won) dist[nextAttemptCount] = (dist[nextAttemptCount] ?? 0) + 1;

          return {
            ...prev,
            totalGames: prev.totalGames + 1,
            totalWins: prev.totalWins + (won ? 1 : 0),
            currentStreak: newStreak,
            maxStreak: Math.max(prev.maxStreak, newStreak),
            lastPlayedDate: today,
            lastPlayedPuzzleId: puzzle.id,
            distribution: dist,
          };
        });

        // Submit result to backend
        try {
          const finalState = { ...snap, rows: [...snap.rows, newRow], attemptCount: nextAttemptCount };
          const clearTimeMs = won ? Date.now() - snap.startedAt : null;
          await fetch("/api/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              puzzleId: puzzle.id,
              sessionKey,
              mode,
              attemptsCount: nextAttemptCount,
              maxAttempts: puzzle.maxAttempts,
              cleared: won,
              clearTimeMs,
              startedAt: snap.startedAt,
              guessHistory: [...snap.rows, newRow].map((r) =>
                r.tokens.map((t) => t.value).join("")
              ),
              feedbackHistory: [...snap.rows, newRow].map((r) => r.feedback),
            }),
          });
        } catch {
          // Result submission failure is non-fatal
        }

        if (won) {
          showToast("정답입니다! 🎉", "success", 3000);
        }
      }
    } catch {
      showToast("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, state, puzzle, mode, showToast, clearGame, updateStats]);

  const dismissToast = useCallback(() => setToast(null), []);

  return {
    state,
    keyboardState,
    toast,
    appendCell,
    deleteToken,
    clearInput,
    submitGuess,
    dismissToast,
  };
}
