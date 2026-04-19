/**
 * apps/mobile — Step Play Screen
 * Loads a puzzle from the step's pool (unseen preferred) and runs the game.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../../../constants/Colors";
import { Toast } from "../../../components/ui/Toast";
import { PuzzleHeaderCard } from "../../../components/game/PuzzleHeaderCard";
import { AttemptGrid } from "../../../components/game/AttemptGrid";
import { InputPreviewBar } from "../../../components/game/InputPreviewBar";
import { ScientificKeypad } from "../../../components/game/ScientificKeypad";
import { useGameSession } from "../../../hooks/useGameSession";
import { BlockFieldModal } from "../../../components/game/BlockFieldModal";
import { selectPuzzleForStep } from "@mathdle/core";
import type { PuzzleViewModel, KeypadToken } from "@mathdle/core";
import { markStepCleared } from "../../../utils/progress";

function seenKey(stepCode: string) {
  return `seen_puzzles_${stepCode}`;
}

export default function StepPlayScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<PuzzleViewModel | null>(null);
  const [runKey, setRunKey] = useState(0);

  const [stageNum, stepNum] = code.split("-").map(Number);
  const isBoss = stepNum === 10;

  const goToStage = useCallback(() => {
    router.replace(`/stage/${stageNum}` as never);
  }, [router, stageNum]);

  const loadPuzzle = useCallback(async () => {
    const raw = await AsyncStorage.getItem(seenKey(code));
    const seenIds: string[] = raw ? JSON.parse(raw) : [];

    const selected = selectPuzzleForStep(stageNum, stepNum, seenIds);
    if (!selected) return;

    const updated = Array.from(new Set([...seenIds, selected.id]));
    await AsyncStorage.setItem(seenKey(code), JSON.stringify(updated));

    setPuzzle(selected);
    setRunKey((k) => k + 1);
  }, [code, stageNum, stepNum]);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  if (!puzzle) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.brand} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const handleNextStep = () => {
    if (isBoss) {
      // Boss cleared → go to stage map so next stage appears unlocked
      router.replace("/" as never);
    } else {
      router.replace(`/step/${stageNum}-${stepNum + 1}` as never); // replace prevents stack buildup
    }
  };

  return (
    <SafeAreaView style={styles.safe} key={runKey}>
      <GameContent
        puzzle={puzzle}
        stepCode={code}
        isBoss={isBoss}
        onRetry={loadPuzzle}
        onBack={goToStage}
        onNextStep={handleNextStep}
        onCleared={() => markStepCleared(code)}
      />
    </SafeAreaView>
  );
}

function GameContent({
  puzzle,
  stepCode,
  isBoss,
  onRetry,
  onBack,
  onNextStep,
  onCleared,
}: {
  puzzle: PuzzleViewModel;
  stepCode: string;
  isBoss: boolean;
  onRetry: () => void;
  onBack: () => void;
  onNextStep: () => void;
  onCleared: () => void;
}) {
  const [showResult, setShowResult] = useState(false);
  const clearedSaved = useRef(false);

  const {
    state,
    keyboardState,
    toast,
    focusedPath,
    setFocusedPath,
    appendToken,
    appendBlock,
    deleteCell,
    clearInput,
    submitGuess,
  } = useGameSession({ puzzle, mode: "practice" });

  const isGameOver = state.status === "win" || state.status === "lose";
  const isLoading = state.status === "loading";

  const handleToken = useCallback(
    (token: KeypadToken) => {
      if (isGameOver) return;
      if (token.type === "block" && (token.blockFieldCount ?? 0) > 0) {
        // Block with fields → directly append the block shell, UI will let user type into it
        
        const defaultFields: Record<string, string> = {};
        for (const fname of token.blockFieldNames || []) {
          defaultFields[fname] = "";
        }
        
        appendBlock(token.value as string, defaultFields);
      } else {
        appendToken(token);
      }
    },
    [isGameOver, appendToken, appendBlock]
  );

  useEffect(() => {
    if (state.status === "win" && !clearedSaved.current) {
      clearedSaved.current = true;
      onCleared();
    }
    if (isGameOver) setShowResult(true);
  }, [state.status, isGameOver, onCleared]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.brand} style={{ marginTop: 80 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Step context header */}
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.stepHeaderCenter}>
          <Text style={styles.stepCode}>{stepCode}</Text>
          {isBoss && <Text style={styles.bossTag}>BOSS</Text>}
        </View>
        <Text style={styles.attemptBadge}>
          {state.attemptCount}/{puzzle.maxAttempts}
        </Text>
      </View>

      <Toast toast={toast} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PuzzleHeaderCard puzzle={puzzle} attemptCount={state.attemptCount} solved={state.status === "win"} />

        <AttemptGrid
          answerLength={puzzle.answerLength}
          maxAttempts={puzzle.maxAttempts}
          rows={state.rows}
          currentCells={state.currentCells}
          isInvalid={!!state.errorMessage}
          focusedPath={focusedPath}
          setFocusedPath={setFocusedPath}
        />

        {!isGameOver && (
          <InputPreviewBar
            cells={state.currentCells}
            maxLength={puzzle.answerLength}
            onDelete={deleteCell}
          />
        )}

        {isGameOver && (
          <TouchableOpacity
            style={[
              styles.resultBanner,
              state.status === "win" ? styles.winBanner : styles.loseBanner,
            ]}
            onPress={() => setShowResult(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.resultBannerText,
                state.status === "win" ? styles.winText : styles.loseText,
              ]}
            >
              {state.status === "win" ? "🎉 결과 보기" : "😔 결과 보기"}
            </Text>
          </TouchableOpacity>
        )}

        <ScientificKeypad
          groups={puzzle.availableTokenGroups}
          keyboardState={keyboardState}
          disabled={isGameOver}
          onToken={handleToken}
          onDelete={deleteCell}
          onClear={clearInput}
          onSubmit={() => void submitGuess()}
        />
      </ScrollView>

      {/* Result Modal */}
      <StepResultModal
        visible={showResult}
        solved={state.status === "win"}
        isBoss={isBoss}
        attemptCount={state.attemptCount}
        onClose={() => setShowResult(false)}
        onRetry={() => {
          setShowResult(false);
          onRetry();
        }}
        onNextStep={() => {
          setShowResult(false);
          onNextStep();
        }}
        onBack={onBack}
      />
    </View>
  );
}

function StepResultModal({
  visible,
  solved,
  isBoss,
  attemptCount,
  onClose,
  onRetry,
  onNextStep,
  onBack,
}: {
  visible: boolean;
  solved: boolean;
  isBoss: boolean;
  attemptCount: number;
  onClose: () => void;
  onRetry: () => void;
  onNextStep: () => void;
  onBack: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modal.backdrop}>
        <View style={modal.sheet}>
          <Text style={modal.emoji}>{solved ? (isBoss ? "🏆" : "🎉") : "😔"}</Text>
          <Text style={modal.headline}>
            {solved ? (isBoss ? "스테이지 클리어!" : "정답!") : "아쉬워요"}
          </Text>
          <Text style={modal.sub}>
            {solved
              ? isBoss
                ? `보스를 ${attemptCount}번 만에 클리어했습니다!`
                : `${attemptCount}번 만에 클리어했습니다!`
              : "다른 퍼즐로 다시 도전해보세요."}
          </Text>

          {solved && (
            <TouchableOpacity
              style={[modal.btn, modal.btnPrimary]}
              onPress={onNextStep}
              activeOpacity={0.8}
            >
              <Text style={[modal.btnText, modal.btnTextPrimary]}>
                {isBoss ? "다음 스테이지 →" : "다음 스텝 →"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[modal.btn, modal.btnSecondary]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Text style={modal.btnText}>
              {solved ? "다시 도전" : "다른 문제로 재도전"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[modal.btn, modal.btnGhost]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={[modal.btnText, modal.btnTextGhost]}>
              스테이지로 돌아가기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gameBg },
  container: { flex: 1, backgroundColor: Colors.gameBg },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gameBorder,
    gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 20, color: Colors.brand },
  stepHeaderCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  stepCode: { fontSize: 14, fontFamily: "monospace", fontWeight: "700", color: Colors.gameText },
  bossTag: {
    fontSize: 10, fontWeight: "700",
    backgroundColor: "#451A0340", color: "#FCD34D",
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1, borderColor: "#F59E0B40",
  },
  attemptBadge: { fontSize: 13, color: Colors.gameTextMuted, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 8, gap: 12, paddingBottom: 32 },
  resultBanner: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  winBanner: { backgroundColor: "rgba(22,101,52,0.3)", borderColor: "rgba(34,197,94,0.5)" },
  loseBanner: { backgroundColor: "rgba(127,29,29,0.2)", borderColor: "rgba(239,68,68,0.4)" },
  resultBannerText: { fontSize: 16, fontWeight: "700" },
  winText: { color: "#86efac" },
  loseText: { color: "#fca5a5" },
});

const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.gameCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    gap: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: Colors.gameBorder,
  },
  emoji: { fontSize: 48 },
  headline: { fontSize: 26, fontWeight: "900", color: Colors.gameText },
  sub: { fontSize: 14, color: Colors.gameTextMuted, marginBottom: 8, textAlign: "center" },
  btn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: Colors.brand },
  btnSecondary: {
    backgroundColor: Colors.brand + "22",
    borderWidth: 1,
    borderColor: Colors.brand + "44",
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: Colors.gameBorder,
  },
  btnText: { fontSize: 16, fontWeight: "700", color: Colors.gameText },
  btnTextPrimary: { color: "#fff" },
  btnTextGhost: { color: Colors.gameTextMuted },
});
