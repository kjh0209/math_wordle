/**
 * apps/mobile — useGameSession
 *
 * Core game session hook for React Native.
 * Manages the full game state machine: loading → playing → win/lose
 * Persists state to AsyncStorage via useLocalPersistence.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  PuzzleViewModel,
  GameState,
  GameStatus,
  GameMode,
  GuessRow,
  FeedbackColor,
  KeyboardState,
  ToastMessage,
  LocalGameRecord,
  SessionStats,
  TokenUnit,
  KeypadToken,
} from "@mathdle/core";
import {
  colorPriority,
  validateGuessApi,
  submitResult,
} from "@mathdle/core";
import { useLocalPersistence } from "./useLocalPersistence";

interface UseGameSessionOptions {
  puzzle: PuzzleViewModel;
  mode: GameMode;
}

interface UseGameSessionReturn {
  state: GameState;
  keyboardState: KeyboardState;
  toast: ToastMessage | null;
  appendToken: (token: TokenUnit) => void;
  deleteToken: () => void;
  clearInput: () => void;
  submitGuess: () => Promise<void>;
  dismissToast: () => void;
}

const DEFAULT_STATS: SessionStats = {
  totalGames: 0,
  totalWins: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: null,
  lastPlayedPuzzleId: null,
  distribution: {},
};

function generateToastId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useGameSession({
  puzzle,
  mode,
}: UseGameSessionOptions): UseGameSessionReturn {
  const persistence = useLocalPersistence();
  const isSubmittingRef = useRef(false);

  const [state, setState] = useState<GameState>({
    puzzleId: puzzle.id,
    mode,
    status: "loading",
    rows: [],
    currentTokens: [],
    errorMessage: null,
    startedAt: Date.now(),
    completedAt: null,
    attemptCount: 0,
    maxAttempts: puzzle.maxAttempts,
    shareCode: null,
  });

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // ── Load saved game on mount / puzzle change ─────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const saved = await persistence.loadGame(puzzle.id);
      if (cancelled) return;

      if (saved && saved.status === "playing") {
        setState({
          puzzleId: puzzle.id,
          mode,
          status: "playing",
          rows: saved.rows,
          currentTokens: saved.currentTokens,
          errorMessage: null,
          startedAt: saved.startedAt,
          completedAt: null,
          attemptCount: saved.rows.filter((r) => r.status === "submitted")
            .length,
          maxAttempts: puzzle.maxAttempts,
          shareCode: null,
        });
      } else {
        setState({
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
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [puzzle.id]);

  // ── Auto-save on every state change ──────────────────────────────────
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
    // fire and forget
    persistence.saveGame(record);
  }, [state.rows, state.currentTokens, state.status]);

  // ── Keyboard state ───────────────────────────────────────────────────
  const keyboardState = useMemo<KeyboardState>(() => {
    const ks: KeyboardState = {};
    for (const row of state.rows) {
      if (row.status !== "submitted") continue;
      row.tokens.forEach((token, i) => {
        const color = row.feedback[i];
        if (!color) return;
        const current = ks[token.value];
        if (
          !current ||
          colorPriority(color) > colorPriority(current as FeedbackColor)
        ) {
          ks[token.value] = color;
        }
      });
    }
    return ks;
  }, [state.rows]);

  // ── Toast ────────────────────────────────────────────────────────────
  const showToast = useCallback(
    (
      message: string,
      type: ToastMessage["type"] = "error",
      durationMs = 2500,
    ) => {
      const id = generateToastId();
      setToast({ id, type, message, durationMs });
      setTimeout(() => setToast((t) => (t?.id === id ? null : t)), durationMs);
    },
    [],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Input actions ────────────────────────────────────────────────────
  const appendToken = useCallback(
    (token: TokenUnit) => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.currentTokens.length >= puzzle.tokenLength) return prev;
        return {
          ...prev,
          currentTokens: [...prev.currentTokens, token],
          errorMessage: null,
        };
      });
    },
    [puzzle.tokenLength],
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

  // ── Submit guess ─────────────────────────────────────────────────────
  const submitGuess = useCallback(async () => {
    if (isSubmittingRef.current) return;

    // Read current state
    const snap = state;
    if (snap.status !== "playing") return;

    if (snap.currentTokens.length < puzzle.tokenLength) {
      showToast(`${puzzle.tokenLength}칸을 모두 채워주세요.`);
      return;
    }

    isSubmittingRef.current = true;
    const guess = snap.currentTokens.map((t) => t.value).join("");
    const sessionKey = await persistence.getOrCreateSessionKey();

    try {
      const data = await validateGuessApi({
        puzzleId: puzzle.id,
        guess,
        sessionKey,
        attemptNumber: snap.attemptCount + 1,
        startTimeMs: snap.startedAt,
      });

      if (!data.ok || !data.feedback) {
        showToast(data.message ?? "올바르지 않은 수식입니다.");
        setState((prev) => ({
          ...prev,
          errorMessage: data.message ?? "올바르지 않은 수식입니다.",
        }));
        return;
      }

      const newRow: GuessRow = {
        tokens: snap.currentTokens,
        feedback: data.feedback,
        status: "submitted",
      };

      const nextAttemptCount = snap.attemptCount + 1;
      const won = data.solved ?? false;
      const lost =
        !won && (data.gameOver ?? nextAttemptCount >= puzzle.maxAttempts);

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

      // ── Game over side effects ───────────────────────────────────
      if (nextStatus !== "playing") {
        // Clear saved game
        persistence.clearGame(puzzle.id);

        // Update stats
        const prev = (await persistence.loadStats()) ?? DEFAULT_STATS;
        const today = new Date().toISOString().split("T")[0];
        const isConsecutive =
          prev.lastPlayedDate &&
          new Date(prev.lastPlayedDate).getTime() >= Date.now() - 86_400_000;

        const newStreak = won
          ? isConsecutive
            ? prev.currentStreak + 1
            : 1
          : 0;

        const dist = { ...prev.distribution };
        if (won) dist[nextAttemptCount] = (dist[nextAttemptCount] ?? 0) + 1;

        await persistence.saveStats({
          totalGames: prev.totalGames + 1,
          totalWins: prev.totalWins + (won ? 1 : 0),
          currentStreak: newStreak,
          maxStreak: Math.max(prev.maxStreak, newStreak),
          lastPlayedDate: today,
          lastPlayedPuzzleId: puzzle.id,
          distribution: dist,
        });

        // Submit result to backend (non-fatal)
        try {
          const allRows = [...snap.rows, newRow];
          const clearTimeMs = won ? Date.now() - snap.startedAt : null;
          await submitResult({
            puzzleId: puzzle.id,
            sessionKey,
            mode,
            attemptsCount: nextAttemptCount,
            maxAttempts: puzzle.maxAttempts,
            cleared: won,
            clearTimeMs,
            startedAt: snap.startedAt,
            guessHistory: allRows.map((r) =>
              r.tokens.map((t) => t.value).join(""),
            ),
            feedbackHistory: allRows.map((r) => r.feedback),
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
      isSubmittingRef.current = false;
    }
  }, [state, puzzle, mode, showToast, persistence]);

  return {
    state,
    keyboardState,
    toast,
    appendToken,
    deleteToken,
    clearInput,
    submitGuess,
    dismissToast,
  };
}
