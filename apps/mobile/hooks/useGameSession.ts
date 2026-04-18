/**
 * apps/mobile — useGameSession (cell-based, finalized spec)
 *
 * Core game session hook for React Native.
 * Manages the full game state machine: loading → playing → win/lose
 * Persists state to AsyncStorage via useLocalPersistence.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  PuzzleViewModel,
  PuzzleCell,
  GameState,
  GameStatus,
  GameMode,
  GuessRow,
  FeedbackColor,
  KeyboardState,
  ToastMessage,
  LocalGameRecord,
  SessionStats,
  KeypadToken,
} from "@mathdle/core";
import {
  colorPriority,
  cellDisplayKey,
  compareGuessCells,
  validateGuessCells,
  submitResult,
  validateGuessApi,
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
  appendToken: (token: KeypadToken) => void;
  deleteCell: () => void;
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
    currentCells: [],
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
        // Migrate old saves: currentTokens → currentCells
        const savedAny = saved as Record<string, unknown>;
        const cells = (saved.currentCells ??
          (savedAny.currentTokens as PuzzleCell[] | undefined) ??
          []) as PuzzleCell[];

        setState({
          puzzleId: puzzle.id,
          mode,
          status: "playing",
          rows: saved.rows,
          currentCells: cells,
          errorMessage: null,
          startedAt: saved.startedAt,
          completedAt: null,
          attemptCount: saved.rows.filter((r) => r.status === "submitted").length,
          maxAttempts: puzzle.maxAttempts,
          shareCode: null,
        });
      } else {
        setState({
          puzzleId: puzzle.id,
          mode,
          status: "playing",
          rows: [],
          currentCells: [],
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
  }, [puzzle.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save on every state change ──────────────────────────────────
  useEffect(() => {
    if (state.status !== "playing") return;

    const record: LocalGameRecord = {
      puzzleId: state.puzzleId,
      mode: state.mode,
      status: "playing",
      rows: state.rows,
      currentCells: state.currentCells,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      savedAt: Date.now(),
    };
    persistence.saveGame(record);
  }, [state.rows, state.currentCells, state.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard state ───────────────────────────────────────────────────
  const keyboardState = useMemo<KeyboardState>(() => {
    const ks: KeyboardState = {};
    for (const row of state.rows) {
      if (row.status !== "submitted") continue;
      row.cells.forEach((cell, i) => {
        const color = row.feedback[i];
        if (!color) return;
        const key = cellDisplayKey(cell);
        const current = ks[key];
        if (!current || colorPriority(color) > colorPriority(current as FeedbackColor)) {
          ks[key] = color;
        }
      });
    }
    return ks;
  }, [state.rows]);

  // ── Toast ────────────────────────────────────────────────────────────
  const showToast = useCallback(
    (message: string, type: ToastMessage["type"] = "error", durationMs = 2500) => {
      const id = generateToastId();
      setToast({ id, type, message, durationMs });
      setTimeout(() => setToast((t) => (t?.id === id ? null : t)), durationMs);
    },
    [],
  );

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Input actions ────────────────────────────────────────────────────
  const appendToken = useCallback(
    (token: KeypadToken) => {
      if (token.type === "block") return; // blocks handled separately (web only for now)
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.currentCells.length >= puzzle.answerLength) return prev;
        const cell: PuzzleCell = { type: "token", value: token.value };
        return { ...prev, currentCells: [...prev.currentCells, cell], errorMessage: null };
      });
    },
    [puzzle.answerLength],
  );

  const deleteCell = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      return { ...prev, currentCells: prev.currentCells.slice(0, -1), errorMessage: null };
    });
  }, []);

  const clearInput = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      return { ...prev, currentCells: [], errorMessage: null };
    });
  }, []);

  // ── Submit guess ─────────────────────────────────────────────────────
  const submitGuess = useCallback(async () => {
    if (isSubmittingRef.current) return;

    const snap = state;
    if (snap.status !== "playing") return;

    if (snap.currentCells.length < puzzle.answerLength) {
      showToast(`${puzzle.answerLength}칸을 모두 채워주세요.`);
      return;
    }

    isSubmittingRef.current = true;
    const sessionKey = await persistence.getOrCreateSessionKey();

    try {
      let feedback: FeedbackColor[];
      let won: boolean;
      let gameOver: boolean;

      const hasApi = !!(process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL);

      if (hasApi) {
        // ── Server-side validation ──────────────────────────────────
        const data = await validateGuessApi({
          puzzleId: puzzle.id,
          guessCells: snap.currentCells,
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
        feedback = data.feedback;
        won = data.solved ?? false;
        gameOver = data.gameOver ?? false;
      } else {
        // ── Offline / client-side validation ────────────────────────
        const answerCells = puzzle.meta?.answerCells;
        if (!answerCells) {
          showToast("오프라인 모드에서는 정답 정보가 필요합니다.");
          return;
        }

        // Basic length check (no full domain model needed offline)
        if (snap.currentCells.length !== puzzle.answerLength) {
          showToast(`${puzzle.answerLength}칸을 모두 채워주세요.`);
          return;
        }

        feedback = compareGuessCells(snap.currentCells, answerCells);
        won = feedback.every((f) => f === "correct");
        gameOver = false;
      }

      const newRow: GuessRow = {
        cells: snap.currentCells,
        feedback,
        status: "submitted",
      };

      const nextAttemptCount = snap.attemptCount + 1;
      const lost = !won && (gameOver || nextAttemptCount >= puzzle.maxAttempts);

      let nextStatus: GameStatus = "playing";
      if (won) nextStatus = "win";
      else if (lost) nextStatus = "lose";

      setState((prev) => ({
        ...prev,
        rows: [...prev.rows, newRow],
        currentCells: [],
        errorMessage: null,
        attemptCount: nextAttemptCount,
        status: nextStatus,
        completedAt: nextStatus !== "playing" ? Date.now() : null,
      }));

      // ── Game over side effects ───────────────────────────────────
      if (nextStatus !== "playing") {
        persistence.clearGame(puzzle.id);

        const prevStats = (await persistence.loadStats()) ?? DEFAULT_STATS;
        const today = new Date().toISOString().split("T")[0];
        const isConsecutive =
          prevStats.lastPlayedDate &&
          new Date(prevStats.lastPlayedDate).getTime() >= Date.now() - 86_400_000;

        const newStreak = won ? (isConsecutive ? prevStats.currentStreak + 1 : 1) : 0;
        const dist = { ...prevStats.distribution };
        if (won) dist[nextAttemptCount] = (dist[nextAttemptCount] ?? 0) + 1;

        await persistence.saveStats({
          totalGames: prevStats.totalGames + 1,
          totalWins: prevStats.totalWins + (won ? 1 : 0),
          currentStreak: newStreak,
          maxStreak: Math.max(prevStats.maxStreak, newStreak),
          lastPlayedDate: today,
          lastPlayedPuzzleId: puzzle.id,
          distribution: dist,
        });

        // Submit to backend (non-fatal, only when API is configured)
        if (process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL) {
          try {
            const allRows = [...snap.rows, newRow];
            await submitResult({
              puzzleId: puzzle.id,
              sessionKey,
              mode,
              attemptsCount: nextAttemptCount,
              maxAttempts: puzzle.maxAttempts,
              cleared: won,
              clearTimeMs: won ? Date.now() - snap.startedAt : null,
              startedAt: snap.startedAt,
              guessHistory: allRows.map((r) => JSON.stringify(r.cells)),
              feedbackHistory: allRows.map((r) => r.feedback),
            });
          } catch {
            // non-fatal
          }
        }

        if (won) showToast("정답입니다! 🎉", "success", 3000);
      }
    } catch {
      showToast("채점 중 오류가 발생했습니다.");
    } finally {
      isSubmittingRef.current = false;
    }
  }, [state, puzzle, mode, showToast, persistence]);

  return {
    state,
    keyboardState,
    toast,
    appendToken,
    deleteCell,
    clearInput,
    submitGuess,
    dismissToast,
  };
}
