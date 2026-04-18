/**
 * apps/mobile — Play screen
 * The main game screen: puzzle header, attempt grid, keypad, result modal.
 */

import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/ui/AppHeader";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { Toast } from "../components/ui/Toast";
import { PuzzleHeaderCard } from "../components/game/PuzzleHeaderCard";
import { AttemptGrid } from "../components/game/AttemptGrid";
import { InputPreviewBar } from "../components/game/InputPreviewBar";
import { ScientificKeypad } from "../components/game/ScientificKeypad";
import { ResultModal } from "../components/result/ResultModal";
import { usePuzzleLoader } from "../hooks/usePuzzleLoader";
import { useGameSession } from "../hooks/useGameSession";
import { useShareResult } from "../hooks/useShareResult";
import { Colors } from "../constants/Colors";
import type { KeypadToken, FeedbackColor } from "@mathdle/core";

export default function PlayScreen() {
  const { puzzle, loading, error, reload } = usePuzzleLoader("daily");

  if (loading || !puzzle) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader />
        <LoadingState message="퍼즐 불러오는 중..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader />
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <GameContent puzzle={puzzle} />
    </SafeAreaView>
  );
}

function GameContent({ puzzle }: { puzzle: NonNullable<ReturnType<typeof usePuzzleLoader>["puzzle"]> }) {
  const router = useRouter();
  const [showResult, setShowResult] = useState(false);

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
  const isLoading = state.status === "loading";

  // Build submitted feedback rows for share
  const submittedFeedbackRows: FeedbackColor[][] = state.rows
    .filter((r) => r.status === "submitted")
    .map((r) => r.feedback);

  const { copied, copyText, nativeShare } = useShareResult({
    puzzle,
    mode: "daily",
    solved: state.status === "win",
    attemptsUsed: state.attemptCount,
    clearTimeMs:
      state.completedAt && state.status === "win"
        ? state.completedAt - state.startedAt
        : null,
    rows: submittedFeedbackRows,
    shareCode: state.shareCode ?? undefined,
  });

  // Auto-show result modal
  const handleGameOverBanner = useCallback(() => {
    setShowResult(true);
  }, []);

  const handleToken = useCallback(
    (token: KeypadToken) => {
      if (isGameOver) return;
      appendToken({
        value: token.value,
        display: token.display,
        type: token.type,
      });
    },
    [isGameOver, appendToken],
  );

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <LoadingState message="게임 상태 복원 중..." />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <Toast toast={toast} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Puzzle header */}
        <PuzzleHeaderCard puzzle={puzzle} attemptCount={state.attemptCount} />

        {/* Game grid */}
        <AttemptGrid
          tokenLength={puzzle.tokenLength}
          maxAttempts={puzzle.maxAttempts}
          rows={state.rows}
          currentTokens={state.currentTokens}
          isInvalid={isInvalid}
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
          <TouchableOpacity
            style={[
              styles.gameOverBtn,
              state.status === "win" ? styles.winBtn : styles.loseBtn,
            ]}
            onPress={handleGameOverBanner}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.gameOverText,
              state.status === "win" ? styles.winText : styles.loseText,
            ]}>
              {state.status === "win" ? "🎉 결과 보기" : "😔 결과 보기"}
            </Text>
          </TouchableOpacity>
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

        <Text style={styles.footer}>
          오늘의 퍼즐 · 최대 {puzzle.maxAttempts}회 시도
        </Text>
      </ScrollView>

      {/* Result modal */}
      {isGameOver && (
        <ResultModal
          visible={showResult}
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
          onShare={nativeShare}
          onCopyText={copyText}
          onPlayAgain={() => router.replace("/play")}
          copied={copied}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gameBg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.gameBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    gap: 12,
    paddingBottom: 32,
  },
  gameOverBtn: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  winBtn: {
    backgroundColor: "rgba(22,101,52,0.3)",
    borderColor: "rgba(34,197,94,0.5)",
  },
  loseBtn: {
    backgroundColor: "rgba(127,29,29,0.2)",
    borderColor: "rgba(239,68,68,0.4)",
  },
  gameOverText: {
    fontSize: 16,
    fontWeight: "700",
  },
  winText: {
    color: "#86efac",
  },
  loseText: {
    color: "#fca5a5",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.gameMuted,
    paddingBottom: 16,
  },
});
