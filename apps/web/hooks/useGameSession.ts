"use client";

/**
 * hooks/useGameSession.ts — Cell-based game session (finalized spec)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { colorPriority, cellDisplayKey, validateBlockFields } from "@mathdle/core";
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
  focusedPath: (string|number)[] | null;
  setFocusedPath: (path: (string|number)[] | null) => void;
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
  const [focusedPath, setFocusedPath] = useState<(string|number)[] | null>(null);
  const currentCellsRef = useRef<PuzzleCell[]>([]);
  currentCellsRef.current = state.currentCells;

  useEffect(() => {
    setState(initState());
    setFocusedPath(null);
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

  // Keyboard state: best feedback color per cell display key.
  // We need to flatten the nested feedback to find best color for tokens.
  const keyboardState = useMemo<KeyboardState>(() => {
    const ks: KeyboardState = {};
    
    function processFeedback(cells: PuzzleCell[], feedbackList: import("@/types/game").NestedFeedback[] | import("@/types/game").FeedbackColor[]) {
      cells.forEach((cell, i) => {
        const feedbackObj = feedbackList[i];
        if (!feedbackObj) return;
        
        // Handle both backward-compatible string colors and NestedFeedback objects
        const color = typeof feedbackObj === "string" ? feedbackObj : feedbackObj.color;
        
        const key = cellDisplayKey(cell);
        const current = ks[key];
        if (!current || colorPriority(color as FeedbackColor) > colorPriority(current as FeedbackColor)) {
          ks[key] = color as FeedbackColor;
        }

        // Process sub-fields recursively
        if (cell.type === "block" && cell.cellFields && typeof feedbackObj !== "string" && feedbackObj.fields) {
          for (const [fieldName, fieldCells] of Object.entries(cell.cellFields)) {
            if (feedbackObj.fields[fieldName]) {
              processFeedback(fieldCells, feedbackObj.fields[fieldName]);
            }
          }
        }
      });
    }

    for (const row of state.rows) {
      if (row.status !== "submitted") continue;
      processFeedback(row.cells, row.feedback);
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

  /**
   * Insert a cell at the position indicated by `path`.
   * Path format:
   *   null              → append to root cells
   *   [blockIdx, fieldName] → append to block's field
   * If the path element types don't match (e.g., a number path to a non-block),
   * the insertion is silently skipped.
   */
  const insertAtCursor = useCallback((cells: PuzzleCell[], path: (string|number)[] | null, newCell: PuzzleCell, maxLength: number): PuzzleCell[] => {
    if (!path || path.length === 0) {
      if (cells.length >= maxLength) return cells;
      return [...cells, newCell];
    }

    const [index, fieldName, ...restPath] = path;
    if (typeof index !== "number" || typeof fieldName !== "string") return cells;

    const targetBlock = cells[index];
    if (!targetBlock || targetBlock.type !== "block") return cells;

    const newFields = { ...(targetBlock.cellFields || {}) };
    // Each block field slot holds exactly 1 token — enforce the limit here.
    newFields[fieldName] = insertAtCursor(newFields[fieldName] || [], restPath.length ? restPath : null, newCell, 1);

    const newCells = [...cells];
    newCells[index] = { ...targetBlock, cellFields: newFields };
    return newCells;
  }, []);

  /**
   * Delete the last cell at the position indicated by `path`.
   * Path format mirrors insertAtCursor.
   */
  const deleteAtCursor = useCallback((cells: PuzzleCell[], path: (string|number)[] | null): PuzzleCell[] => {
    if (!path || path.length === 0) {
      return cells.slice(0, -1);
    }

    const [index, fieldName, ...restPath] = path;
    if (typeof index !== "number" || typeof fieldName !== "string") return cells;

    const targetBlock = cells[index];
    if (!targetBlock || targetBlock.type !== "block" || !targetBlock.cellFields) return cells;

    const newFields = { ...targetBlock.cellFields };
    if (newFields[fieldName]) {
      newFields[fieldName] = deleteAtCursor(newFields[fieldName], restPath.length ? restPath : null);
    }

    const newCells = [...cells];
    newCells[index] = { ...targetBlock, cellFields: newFields };
    return newCells;
  }, []);

  const appendToken = useCallback(
    (token: KeypadToken) => {
      if (token.type === "block") return; // handled by appendBlock
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        const cell: PuzzleCell = { type: "token", value: token.value };
        const newCells = insertAtCursor(prev.currentCells, focusedPath, cell, puzzle.answerLength);

        // Auto-advance cursor after filling a block field (each field = exactly 1 token).
        // Done inside setState so we operate on the brand-new cells array.
        if (focusedPath && focusedPath.length === 2) {
          const [blockIdx, fieldName] = focusedPath as [number, string];
          const block = newCells[blockIdx];
          if (block?.type === "block") {
            const fieldNames = Object.keys(block.fields);
            const currentFieldCells = block.cellFields?.[fieldName] ?? [];
            // Only advance if the field is now filled (length === 1)
            if (currentFieldCells.length === 1) {
              const idx = fieldNames.indexOf(fieldName as string);
              const nextField = fieldNames[idx + 1];
              // Schedule the focus update after setState settles
              setTimeout(() => {
                setFocusedPath(nextField !== undefined ? [blockIdx, nextField] : null);
              }, 0);
            }
          }
        }

        return { ...prev, currentCells: newCells, errorMessage: null };
      });
    },
    [puzzle.answerLength, focusedPath, insertAtCursor]
  );

  const appendBlock = useCallback(
    (payload: BlockInsertPayload) => {
      // Initialize cellFields from the spec's field names
      const cellFields: Record<string, PuzzleCell[]> = {};
      for (const key of Object.keys(payload.fields)) {
        cellFields[key] = [];
      }

      const cell: PuzzleCell = {
        type: "block",
        blockType: payload.blockType as ReservedBlock,
        fields: payload.fields,
        cellFields,
      };

      let insertedIndex = -1;
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        const newCells = insertAtCursor(prev.currentCells, focusedPath, cell, puzzle.answerLength);
        // Track which index the block was inserted at (root-level append only)
        if (!focusedPath) insertedIndex = newCells.length - 1;
        return { ...prev, currentCells: newCells, errorMessage: null };
      });

      // Auto-focus the first field after inserting a block with fields
      const fieldNames = Object.keys(payload.fields);
      if (fieldNames.length > 0 && !focusedPath && insertedIndex >= 0) {
        setFocusedPath([insertedIndex, fieldNames[0]]);
      }
    },
    [puzzle.answerLength, focusedPath, insertAtCursor]
  );

  const deleteCell = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      return {
        ...prev,
        currentCells: deleteAtCursor(prev.currentCells, focusedPath),
        errorMessage: null,
      };
    });
  }, [focusedPath, deleteAtCursor]);

  const clearInput = useCallback(() => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      return { ...prev, currentCells: [], errorMessage: null };
    });
    setFocusedPath(null);
  }, []);

  const submitGuess = useCallback(async () => {
    if (isSubmitting) return;

    const snap = { ...state };
    if (snap.status !== "playing") return;
    if (snap.currentCells.length < puzzle.answerLength) {
      showToast(`${puzzle.answerLength}칸을 모두 채워주세요.`);
      return;
    }

    // Client-side block field completeness check (mirrors server-side validateBlockFields)
    const blockFieldCheck = validateBlockFields(snap.currentCells);
    if (!blockFieldCheck.ok) {
      showToast(blockFieldCheck.message ?? "블록 내부 칸을 모두 채워주세요.");
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
        feedback?: import("@/types/game").NestedFeedback[];
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
    focusedPath,
    setFocusedPath,
  };
}
