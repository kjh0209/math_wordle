"use client";

/**
 * hooks/useGameSession.ts — Cell-based game session (finalized spec)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PuzzleViewModel, KeypadToken, PuzzleCell, ReservedBlock } from "@/types/puzzle";
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
import { colorPriority, cellDisplayKey } from "@mathdle/core";
import { useLocalPersistence } from "./useLocalPersistence";
import { getSessionKey } from "@/lib/utils/session";
import type { BlockInsertPayload } from "@/components/game/ScientificKeypad";

interface UseGameSessionOptions {
  puzzle: PuzzleViewModel;
  mode: GameMode;
}

interface UseGameSessionReturn {
  state: GameState;
  keyboardState: KeyboardState;
  toast: ToastMessage | null;
  appendToken: (token: KeypadToken) => void;
  appendBlock: (payload: BlockInsertPayload) => void;
  deleteCell: () => void;
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
    if (saved && saved.status === "playing") {
      return {
        puzzleId: puzzle.id,
        mode,
        status: "playing",
        rows: saved.rows,
        currentCells: saved.currentCells,
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
      currentCells: [],
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

  useEffect(() => {
    setState(initState());
  }, [puzzle.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    saveGame(record);
  }, [state, saveGame]);

  // Keyboard state: best feedback color per cell display key
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

  const showToast = useCallback(
    (message: string, type: ToastMessage["type"] = "error", durationMs = 2500) => {
      const id = crypto.randomUUID();
      setToast({ id, type, message, durationMs });
      setTimeout(() => setToast((t) => (t?.id === id ? null : t)), durationMs);
    },
    []
  );

  const appendToken = useCallback(
    (token: KeypadToken) => {
      if (token.type === "block") return; // handled by appendBlock
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.currentCells.length >= puzzle.answerLength) return prev;
        const cell: PuzzleCell = { type: "token", value: token.value };
        return { ...prev, currentCells: [...prev.currentCells, cell], errorMessage: null };
      });
    },
    [puzzle.answerLength]
  );

  const appendBlock = useCallback(
    (payload: BlockInsertPayload) => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        if (prev.currentCells.length >= puzzle.answerLength) return prev;
        const cell: PuzzleCell = {
          type: "block",
          blockType: payload.blockType as ReservedBlock,
          fields: payload.fields,
        };
        return { ...prev, currentCells: [...prev.currentCells, cell], errorMessage: null };
      });
    },
    [puzzle.answerLength]
  );

  const deleteCell = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      return {
        ...prev,
        currentCells: prev.currentCells.slice(0, -1),
        errorMessage: null,
      };
    });
  }, []);

  const clearInput = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      return { ...prev, currentCells: [], errorMessage: null };
    });
  }, []);

  const submitGuess = useCallback(async () => {
    if (isSubmitting) return;

    const snap = { ...state };
    if (snap.status !== "playing") return;
    if (snap.currentCells.length < puzzle.answerLength) {
      showToast(`${puzzle.answerLength}칸을 모두 채워주세요.`);
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
          guessCells: snap.currentCells,
          sessionKey,
          attemptNumber: snap.attemptCount + 1,
          startTimeMs: snap.startedAt,
        }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        feedback?: FeedbackColor[];
        solved?: boolean;
        gameOver?: boolean;
        message?: string;
      };

      if (!data.ok || !data.feedback) {
        showToast(data.message ?? "올바르지 않은 수식입니다.");
        setState((prev) => ({ ...prev, errorMessage: data.message ?? "올바르지 않은 수식입니다." }));
        return;
      }

      const newRow: GuessRow = {
        cells: snap.currentCells,
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
        currentCells: [],
        errorMessage: null,
        attemptCount: nextAttemptCount,
        status: nextStatus,
        completedAt: nextStatus !== "playing" ? Date.now() : null,
      }));

      if (nextStatus !== "playing") {
        clearGame(puzzle.id, mode);
        updateStats((prev) => {
          const today = new Date().toISOString().split("T")[0];
          const isConsecutive =
            prev.lastPlayedDate &&
            new Date(prev.lastPlayedDate).getTime() >= Date.now() - 86_400_000;
          const newStreak = won ? (isConsecutive ? prev.currentStreak + 1 : 1) : 0;
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

        // Submit result (non-fatal)
        try {
          const allRows = [...snap.rows, newRow];
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
              clearTimeMs: won ? Date.now() - snap.startedAt : null,
              startedAt: snap.startedAt,
              guessHistory: allRows.map((r) => JSON.stringify(r.cells)),
              feedbackHistory: allRows.map((r) => r.feedback),
            }),
          });
        } catch {
          // non-fatal
        }

        if (won) showToast("정답입니다! 🎉", "success", 3000);
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
    appendToken,
    appendBlock,
    deleteCell,
    clearInput,
    submitGuess,
    dismissToast,
  };
}
