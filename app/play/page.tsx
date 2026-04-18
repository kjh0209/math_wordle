"use client";

import { useState } from "react";
import { AppHeader } from "@/components/ui/AppHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PuzzleHeaderCard } from "@/components/game/PuzzleHeaderCard";
import { AttemptGrid } from "@/components/game/AttemptGrid";
import { InputPreviewBar } from "@/components/game/InputPreviewBar";
import { ScientificKeypad } from "@/components/game/ScientificKeypad";
import { ResultModal } from "@/components/result/ResultModal";
import { usePuzzleLoader } from "@/hooks/usePuzzleLoader";
import { useGameSession } from "@/hooks/useGameSession";
import { cn } from "@/lib/utils/cn";
import type { PuzzleViewModel, KeypadToken } from "@/types/puzzle";
import type { FeedbackColor } from "@/types/game";

export default function PlayPage() {
  const loader = usePuzzleLoader();
  const [showResult, setShowResult] = useState(false);

  if (loader.status === "loading" || loader.status === "idle") {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <LoadingState message="퍼즐 불러오는 중..." className="flex-1" />
      </div>
    );
  }

  if (loader.status === "error") {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <ErrorState
          message={loader.message}
          className="flex-1"
          action={
            <button
              onClick={loader.reload}
              className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium"
            >
              다시 시도
            </button>
          }
        />
      </div>
    );
  }

  return (
    <GameScreen
      puzzle={loader.puzzle}
      showResult={showResult}
      setShowResult={setShowResult}
    />
  );
}

interface GameScreenProps {
  puzzle: PuzzleViewModel;
  showResult: boolean;
  setShowResult: (v: boolean) => void;
}

function GameScreen({ puzzle, showResult, setShowResult }: GameScreenProps) {
  const {
    state,
    keyboardState,
    toast,
    appendToken,
    deleteToken,
    clearInput,
    submitGuess,
  } = useGameSession({ puzzle, mode: "daily" });

  const isGameOver = state.status === "win" || state.status === "lose";
  const isInvalid = !!state.errorMessage;

  // Auto-show result modal when game ends
  if (isGameOver && !showResult) {
    setTimeout(() => setShowResult(true), 1000);
  }

  const submittedFeedbackRows: FeedbackColor[][] = state.rows
    .filter((r) => r.status === "submitted")
    .map((r) => r.feedback);

  function handleToken(token: KeypadToken) {
    if (isGameOver) return;
    appendToken({ value: token.value, display: token.display, type: token.type });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            "fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl toast-enter",
            "max-w-xs text-center pointer-events-none",
            toast.type === "error" &&
              "bg-red-900/90 text-red-100 border border-red-700",
            toast.type === "success" &&
              "bg-green-900/90 text-green-100 border border-green-700",
            toast.type === "info" &&
              "bg-game-card text-game-text border border-game-border"
          )}
        >
          {toast.message}
        </div>
      )}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* Puzzle header */}
        <PuzzleHeaderCard puzzle={puzzle} attemptCount={state.attemptCount} />

        {/* Game grid */}
        <AttemptGrid
          tokenLength={puzzle.tokenLength}
          maxAttempts={puzzle.maxAttempts}
          rows={state.rows}
          currentTokens={state.currentTokens}
          isInvalid={isInvalid}
          size="lg"
          className="items-center"
        />

        {/* Input preview */}
        {!isGameOver && (
          <InputPreviewBar
            tokens={state.currentTokens}
            maxLength={puzzle.tokenLength}
            onDelete={deleteToken}
          />
        )}

        {/* Game over banner */}
        {isGameOver && (
          <button
            onClick={() => setShowResult(true)}
            className={cn(
              "w-full py-3.5 rounded-2xl text-base font-bold transition-colors",
              state.status === "win"
                ? "bg-green-800/60 border border-green-600 text-green-300"
                : "bg-red-900/40 border border-red-800 text-red-300"
            )}
          >
            {state.status === "win" ? "🎉 결과 보기" : "😔 결과 보기"}
          </button>
        )}

        {/* Scientific Keypad */}
        <ScientificKeypad
          groups={puzzle.availableTokenGroups}
          keyboardState={keyboardState}
          disabled={isGameOver}
          onToken={handleToken}
          onDelete={deleteToken}
          onClear={clearInput}
          onSubmit={() => void submitGuess()}
        />

        <p className="text-center text-xs text-game-muted pb-4 safe-bottom">
          오늘의 퍼즐 · 최대 {puzzle.maxAttempts}회 시도
        </p>
      </main>

      {/* Result modal */}
      {isGameOver && (
        <ResultModal
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          puzzle={puzzle}
          mode="daily"
          solved={state.status === "win"}
          attemptCount={state.attemptCount}
          clearTimeMs={
            state.completedAt && state.status === "win"
              ? state.completedAt - state.startedAt
              : null
          }
          rows={submittedFeedbackRows}
          shareCode={state.shareCode ?? undefined}
          onPlayAgain={() => window.location.reload()}
        />
      )}
    </div>
  );
}
