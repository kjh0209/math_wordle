"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AttemptGrid } from "@/components/game/AttemptGrid";
import { InputPreviewBar } from "@/components/game/InputPreviewBar";
import { ScientificKeypad } from "@/components/game/ScientificKeypad";
import { cn } from "@/lib/utils/cn";
import {
  Crown,
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  Map,
  Trophy,
  Shuffle,
  Timer,
} from "lucide-react";
import type { PuzzleViewModel, KeypadToken, PuzzleCell, FeedbackColor } from "@mathdle/core";
import type { StartRunResponse, FinishRunRequest } from "@/types/api";
import type { GuessRow, ToastMessage } from "@mathdle/core";
import type { BlockInsertPayload } from "@/components/game/ScientificKeypad";
import { getSessionKey } from "@/lib/utils/session";

// ─── Types ────────────────────────────────────────────────────────────────────

type GameStatus = "idle" | "playing" | "win" | "lose";

interface RunState {
  runId: string;
  puzzle: PuzzleViewModel;
  rows: GuessRow[];
  currentCells: PuzzleCell[];
  attemptCount: number;
  status: GameStatus;
  startedAt: number;
  completedAt: number | null;
  errorMessage: string | null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StepPlayPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [stageNum] = code.split("-");

  const [run, setRun] = useState<RunState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [keyboardState, setKeyboardState] = useState<Record<string, FeedbackColor>>({});
  const [focusedPath, setFocusedPath] = useState<(string|number)[] | null>(null);
  const isSubmitting = useRef(false);
  const currentCellsRef = useRef<PuzzleCell[]>([]);
  currentCellsRef.current = run?.currentCells ?? [];

  // Step metadata for display (fetched separately if needed; we derive from code)
  const isBoss = parseInt(code.split("-")[1] ?? "0") === 10;

  const startRun = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setShowResult(false);

    try {
      const sessionKey = getSessionKey();
      const res = await fetch(`/api/steps/${code}/start-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey }),
      });
      const data = (await res.json()) as StartRunResponse & { error?: string };

      if (!res.ok || !data.runId || !data.puzzle) {
        throw new Error(data.error ?? "퍼즐을 불러오지 못했습니다.");
      }

      setRun({
        runId: data.runId,
        puzzle: data.puzzle,
        rows: [],
        currentCells: [],
        attemptCount: 0,
        status: "playing",
        startedAt: Date.now(),
        completedAt: null,
        errorMessage: null,
      });
      setKeyboardState({});
      setFocusedPath(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    startRun();
  }, [startRun]);

  const showToast = useCallback((message: string, type: ToastMessage["type"] = "error") => {
    const id = crypto.randomUUID();
    setToast({ id, type, message, durationMs: 2500 });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2500);
  }, []);

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
    newFields[fieldName] = insertAtCursor(newFields[fieldName] || [], restPath.length ? restPath : null, newCell, Infinity);
    const newCells = [...cells];
    newCells[index] = { ...targetBlock, cellFields: newFields };
    return newCells;
  }, []);

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

  const appendToken = useCallback((token: KeypadToken) => {
    if (token.type === "block") return;
    setRun((prev) => {
      if (!prev || prev.status !== "playing") return prev;
      const cell: PuzzleCell = { type: "token", value: token.value };
      const newCells = insertAtCursor(prev.currentCells, focusedPath, cell, prev.puzzle.answerLength);
      return { ...prev, currentCells: newCells, errorMessage: null };
    });

    // Auto-advance cursor after filling a block field (each field = exactly 1 token)
    if (focusedPath && focusedPath.length === 2) {
      const [blockIdx, fieldName] = focusedPath as [number, string];
      const block = currentCellsRef.current[blockIdx];
      if (block?.type === "block") {
        const fieldNames = Object.keys(block.fields);
        const idx = fieldNames.indexOf(fieldName);
        const nextField = fieldNames[idx + 1];
        setFocusedPath(nextField !== undefined ? [blockIdx, nextField] : null);
      }
    }
  }, [focusedPath, insertAtCursor]);

  const appendBlock = useCallback((payload: BlockInsertPayload) => {
    const cellFields: Record<string, PuzzleCell[]> = {};
    for (const key of Object.keys(payload.fields || {})) {
      cellFields[key] = [];
    }
    const cell: PuzzleCell = {
      type: "block",
      blockType: payload.blockType as import("@mathdle/core").ReservedBlock,
      fields: payload.fields,
      cellFields,
    };
    let insertedIndex = -1;
    setRun((prev) => {
      if (!prev || prev.status !== "playing") return prev;
      const newCells = insertAtCursor(prev.currentCells, focusedPath, cell, prev.puzzle.answerLength);
      if (!focusedPath) insertedIndex = newCells.length - 1;
      return { ...prev, currentCells: newCells, errorMessage: null };
    });
    const firstField = Object.keys(payload.fields)[0];
    if (firstField && !focusedPath && insertedIndex >= 0) {
      setFocusedPath([insertedIndex, firstField]);
    }
  }, [focusedPath, insertAtCursor]);

  const deleteCell = useCallback(() => {
    setRun((prev) => {
      if (!prev || prev.status !== "playing") return prev;
      return { ...prev, currentCells: deleteAtCursor(prev.currentCells, focusedPath), errorMessage: null };
    });
  }, [focusedPath, deleteAtCursor]);

  const clearInput = useCallback(() => {
    setRun((prev) => {
      if (!prev || prev.status !== "playing") return prev;
      return { ...prev, currentCells: [], errorMessage: null };
    });
    setFocusedPath(null);
  }, []);

  const submitGuess = useCallback(async () => {
    if (isSubmitting.current || !run || run.status !== "playing") return;
    if (run.currentCells.length < run.puzzle.answerLength) {
      showToast(`${run.puzzle.answerLength}칸을 모두 채워주세요.`);
      return;
    }

    isSubmitting.current = true;
    try {
      const res = await fetch(`/api/runs/${run.runId}/submit-guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: run.puzzle.id,
          guessCells: run.currentCells,
          sessionKey: getSessionKey(),
          attemptNumber: run.attemptCount + 1,
          startTimeMs: run.startedAt,
        }),
      });

      const data = (await res.json()) as import("@/types/api").ValidateGuessResponse & { message?: string };

      if (!data.ok) {
        const msg = data.message ?? "올바르지 않은 수식입니다.";
        showToast(msg);
        setRun((prev) => prev ? { ...prev, errorMessage: msg } : prev);
        return;
      }

      const newRow: GuessRow = {
        cells: run.currentCells,
        feedback: data.feedback,
        status: "submitted",
      };

      const nextAttemptCount = run.attemptCount + 1;
      const won = data.solved ?? false;
      const lost = !won && (data.gameOver ?? nextAttemptCount >= run.puzzle.maxAttempts);
      const nextStatus: GameStatus = won ? "win" : lost ? "lose" : "playing";
      const completedAt = nextStatus !== "playing" ? Date.now() : null;

      // Update keyboard state from NestedFeedback
      setKeyboardState((ks) => {
        const next = { ...ks };
        newRow.cells.forEach((cell, i) => {
          const fb = newRow.feedback[i];
          if (!fb) return;
          const color = fb.color;
          const key = cell.type === "token" ? cell.value : cell.blockType;
          const cur = next[key] as FeedbackColor | undefined;
          const priority = (c: FeedbackColor) => c === "correct" ? 3 : c === "present" ? 2 : 1;
          if (!cur || priority(color) > priority(cur)) next[key] = color;
        });
        return next;
      });

      setRun((prev) => prev ? {
        ...prev,
        rows: [...prev.rows, newRow],
        currentCells: [],
        errorMessage: null,
        attemptCount: nextAttemptCount,
        status: nextStatus,
        completedAt,
      } : prev);

      if (nextStatus !== "playing") {
        // Finish run
        const sessionKey = getSessionKey();
        void fetch(`/api/runs/${run.runId}/finish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: run.runId,
            puzzleId: run.puzzle.id,
            stepCode: code,
            sessionKey,
            cleared: won,
            attemptsCount: nextAttemptCount,
            clearTimeMs: won && completedAt ? completedAt - run.startedAt : null,
            guessHistory: [...run.rows, newRow].map((r) => ({ cells: r.cells, feedback: r.feedback })),
          } satisfies FinishRunRequest),
        }).catch(() => null);

        setTimeout(() => setShowResult(true), 800);
        if (won) showToast("정답입니다! 🎉", "success");
      }
    } catch {
      showToast("네트워크 오류가 발생했습니다.");
    } finally {
      isSubmitting.current = false;
    }
  }, [run, showToast, code]);

  if (loading) {
    return (
      <Shell>
        <LoadingState message="퍼즐 선택 중..." className="flex-1" />
      </Shell>
    );
  }

  if (loadError || !run) {
    return (
      <Shell>
        <ErrorState
          message={loadError ?? "오류"}
          className="flex-1"
          action={
            <button
              onClick={startRun}
              className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium"
            >
              다시 시도
            </button>
          }
        />
      </Shell>
    );
  }

  const isGameOver = run.status === "win" || run.status === "lose";
  const isInvalid = !!run.errorMessage;

  return (
    <Shell>
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl pointer-events-none",
          "max-w-xs text-center",
          toast.type === "error" && "bg-red-900/90 text-red-100 border border-red-700",
          toast.type === "success" && "bg-green-900/90 text-green-100 border border-green-700",
          toast.type === "info" && "bg-game-card text-game-text border border-game-border"
        )}>
          {toast.message}
        </div>
      )}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* Context header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/step/${code}`}
            className="flex items-center gap-1.5 text-sm text-game-text-muted hover:text-game-text transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {code}
          </Link>
          <div className="flex items-center gap-2">
            {isBoss && (
              <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <Crown className="w-3.5 h-3.5" /> BOSS
              </span>
            )}
            <span className="text-xs text-game-muted font-mono">
              {run.attemptCount}/{run.puzzle.maxAttempts}회
            </span>
          </div>
        </div>

        {/* Puzzle info card */}
        <div className={cn(
          "glass-card px-4 py-3 flex items-center justify-between gap-3",
          isBoss && "border-amber-500/30"
        )}>
          <div className="min-w-0">
            <p className="text-xs text-game-muted mb-0.5">{run.puzzle.category}</p>
            <h2 className="text-base font-bold text-game-text truncate">{run.puzzle.title}</h2>
            {run.puzzle.level && (
              <p className="text-xs text-game-muted mt-0.5">
                {run.puzzle.level.replace(/_/g, " ")}
              </p>
            )}
          </div>
          {run.puzzle.variable && (
            <div className="shrink-0 text-right">
              <p className="text-xs text-game-muted">{run.puzzle.variable.name} =</p>
              <p className="text-sm font-bold text-brand">{run.puzzle.variable.valueDisplay}</p>
            </div>
          )}
        </div>

        {/* Attempt grid */}
        <AttemptGrid
          answerLength={run.puzzle.answerLength}
          maxAttempts={run.puzzle.maxAttempts}
          rows={run.rows}
          currentCells={run.currentCells}
          isInvalid={isInvalid}
          size="lg"
          className="items-center"
          focusedPath={focusedPath}
          setFocusedPath={setFocusedPath}
        />

        {/* Input preview */}
        {!isGameOver && (
          <InputPreviewBar cells={run.currentCells} maxLength={run.puzzle.answerLength} />
        )}

        {/* Game over button */}
        {isGameOver && !showResult && (
          <button
            onClick={() => setShowResult(true)}
            className={cn(
              "w-full py-3.5 rounded-2xl text-base font-bold transition-colors",
              run.status === "win"
                ? "bg-green-800/60 border border-green-600 text-green-300"
                : "bg-red-900/40 border border-red-800 text-red-300"
            )}
          >
            {run.status === "win" ? "🎉 결과 보기" : "😔 결과 보기"}
          </button>
        )}

        {/* Keypad */}
        {!isGameOver && (
          <ScientificKeypad
            groups={run.puzzle.availableTokenGroups}
            keyboardState={keyboardState}
            disabled={isGameOver}
            onToken={appendToken}
            onBlockInsert={appendBlock}
            onDelete={deleteCell}
            onClear={clearInput}
            onSubmit={() => void submitGuess()}
          />
        )}

        <p className="text-center text-xs text-game-muted pb-4 safe-bottom">
          Step {code} · 최대 {run.puzzle.maxAttempts}회 시도
        </p>
      </main>

      {/* Result modal */}
      {isGameOver && showResult && (
        <StepResultModal
          code={code}
          stageNum={stageNum}
          isBoss={isBoss}
          won={run.status === "win"}
          attemptCount={run.attemptCount}
          maxAttempts={run.puzzle.maxAttempts}
          clearTimeMs={run.completedAt && run.status === "win" ? run.completedAt - run.startedAt : null}
          onRetry={() => startRun()}
          onClose={() => setShowResult(false)}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-game-bg text-game-text">
      <AppHeader />
      {children}
    </div>
  );
}

// ─── Result Modal ─────────────────────────────────────────────────────────────

interface StepResultModalProps {
  code: string;
  stageNum: string;
  isBoss: boolean;
  won: boolean;
  attemptCount: number;
  maxAttempts: number;
  clearTimeMs: number | null;
  onRetry: () => void;
  onClose: () => void;
}

function StepResultModal({
  code,
  stageNum,
  isBoss,
  won,
  attemptCount,
  maxAttempts,
  clearTimeMs,
  onRetry,
  onClose,
}: StepResultModalProps) {
  const stepNum = parseInt(code.split("-")[1] ?? "1");
  const nextCode = `${stageNum}-${stepNum + 1}`;
  const hasNextStep = stepNum < 10;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}분 ${s % 60}초` : `${s}초`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className={cn(
        "w-full max-w-md rounded-3xl border p-6 bg-game-card shadow-2xl",
        won ? "border-green-600/40" : "border-red-700/30"
      )}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">
            {won ? (isBoss ? "👑" : "🎉") : "😔"}
          </div>
          <h2 className="text-xl font-bold text-game-text">
            {won ? (isBoss ? "보스 클리어!" : "스텝 클리어!") : "아쉬워요"}
          </h2>
          <p className="text-sm text-game-text-muted mt-1">
            {won
              ? isBoss
                ? "다음 스테이지가 열렸습니다!"
                : "다음 스텝이 열렸습니다!"
              : "포기하지 말고 다시 도전해보세요!"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatBox
            icon={<Trophy className="w-4 h-4" />}
            label="시도"
            value={`${attemptCount}/${maxAttempts}`}
            color={won ? "text-green-400" : "text-red-400"}
          />
          {clearTimeMs != null && (
            <StatBox
              icon={<Timer className="w-4 h-4" />}
              label="시간"
              value={formatTime(clearTimeMs)}
              color="text-brand"
            />
          )}
          <StatBox
            icon={<Shuffle className="w-4 h-4" />}
            label="스텝"
            value={code}
            color="text-game-text"
          />
        </div>

        {/* Retry note on failure */}
        {!won && (
          <div className="flex items-start gap-3 px-4 py-3 bg-blue-900/20 border border-blue-700/30 rounded-xl mb-5">
            <Shuffle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-300 leading-relaxed">
              다시 시도하면 같은 스텝의 다른 퍼즐이 출제될 수 있어요.
              5개의 퍼즐 풀 중 아직 보지 않은 문제를 우선 제공합니다.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {won && hasNextStep && (
            <Link
              href={`/step/${nextCode}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand/90 transition-colors"
            >
              다음 스텝 {nextCode}
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          {won && isBoss && (
            <Link
              href={`/stage/stage-${parseInt(stageNum) + 1}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-colors"
            >
              <Crown className="w-4 h-4" />
              다음 스테이지로
            </Link>
          )}

          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-game-border text-game-text-muted text-sm font-medium hover:bg-game-bg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {won ? "같은 스텝 다시 도전" : "다른 퍼즐로 재도전"}
          </button>

          <Link
            href={`/stage/stage-${stageNum}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-game-muted text-sm hover:text-game-text transition-colors"
          >
            <Map className="w-4 h-4" />
            스테이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 bg-game-bg rounded-xl border border-game-border">
      <span className={cn("text-game-muted", color)}>{icon}</span>
      <p className={cn("text-base font-bold", color)}>{value}</p>
      <p className="text-xs text-game-muted">{label}</p>
    </div>
  );
}
