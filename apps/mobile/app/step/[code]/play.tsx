/**
 * apps/mobile — Step Play Screen
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
  Image,
  ImageBackground,
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

// PLAYER-ACTIONS-Idle: 442×285, 2 frames of 221×285
// Display at height 36: scale = 36/285 = 0.126, frame_w = 221*0.126 ≈ 28, total_w = 442*0.126 ≈ 56
const ACTIONS_IDLE_H = 36;
const ACTIONS_IDLE_SCALE = ACTIONS_IDLE_H / 285;
const ACTIONS_IDLE_FRAME_W = Math.round(221 * ACTIONS_IDLE_SCALE); // ≈ 28
const ACTIONS_IDLE_TOTAL_W = Math.round(442 * ACTIONS_IDLE_SCALE); // ≈ 56

// Action frames — displayed at natural aspect ratio, height 56
const ACTION_FRAME_H = 56;

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

  const goToMap = useCallback(() => {
    router.replace('/' as never);
  }, [router]);

  const loadPuzzle = useCallback(async () => {
    const raw = await AsyncStorage.getItem(seenKey(code));
    const seenIds: string[] = raw ? JSON.parse(raw) : [];
    const selected = selectPuzzleForStep(stageNum, stepNum, seenIds);
    if (!selected) return;
    await AsyncStorage.setItem(seenKey(code), JSON.stringify(Array.from(new Set([...seenIds, selected.id]))));
    setPuzzle(selected);
    setRunKey((k) => k + 1);
  }, [code, stageNum, stepNum]);

  useEffect(() => { loadPuzzle(); }, [loadPuzzle]);

  if (!puzzle) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.warning} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const handleNextStep = () => {
    if (isBoss) {
      router.replace('/' as never);
    } else {
      router.replace(`/step/${stageNum}-${stepNum + 1}` as never);
    }
  };

  return (
    <SafeAreaView style={styles.safe} key={runKey}>
      <GameContent
        puzzle={puzzle}
        stepCode={code}
        isBoss={isBoss}
        onRetry={loadPuzzle}
        onBack={goToMap}
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
  const [actionsIdleFrame, setActionsIdleFrame] = useState(0);
  const [submitFlash, setSubmitFlash] = useState<0 | 1 | null>(null);
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
  const isLoading  = state.status === "loading";

  // PLAYER-ACTIONS-Idle animation (2-frame, 500ms per frame)
  useEffect(() => {
    const id = setInterval(() => setActionsIdleFrame(f => (f + 1) % 2), 500);
    return () => clearInterval(id);
  }, []);

  const handleToken = useCallback((token: KeypadToken) => {
    if (isGameOver) return;
    if (token.type === "block" && (token.blockFieldCount ?? 0) > 0) {
      const defaultFields: Record<string, string> = {};
      for (const fname of token.blockFieldNames || []) defaultFields[fname] = "";
      appendBlock(token.value as string, defaultFields);
    } else {
      appendToken(token);
    }
  }, [isGameOver, appendToken, appendBlock]);

  const handleSubmit = useCallback(async () => {
    // Flash action frames: Frame_1 → Frame_2 → hide
    setSubmitFlash(0);
    setTimeout(() => setSubmitFlash(1), 220);
    setTimeout(() => setSubmitFlash(null), 480);
    await submitGuess();
  }, [submitGuess]);

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
        <ActivityIndicator color={Colors.warning} style={{ marginTop: 80 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Game header */}
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Image source={require('../../../assets/sprites/logo.png')} style={styles.logo} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepCode}>{stepCode}</Text>
          {isBoss && (
            <View style={styles.bossTag}>
              <Text style={styles.bossTagText}>BOSS</Text>
            </View>
          )}
        </View>

        {/* PLAYER-ACTIONS-Idle in header */}
        <View style={{ overflow: 'hidden', width: ACTIONS_IDLE_FRAME_W, height: ACTIONS_IDLE_H, marginRight: 6 }}>
          <Image
            source={require('../../../assets/sprites/PLAYER-ACTIONS-Idle.png')}
            style={{ width: ACTIONS_IDLE_TOTAL_W, height: ACTIONS_IDLE_H, marginLeft: -actionsIdleFrame * ACTIONS_IDLE_FRAME_W }}
          />
        </View>

        <View style={styles.attemptWrap}>
          <Text style={styles.attemptText}>{state.attemptCount}</Text>
          <Text style={styles.attemptSep}>/</Text>
          <Text style={styles.attemptText}>{puzzle.maxAttempts}</Text>
        </View>
      </View>

      <Toast toast={toast} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <InputPreviewBar cells={state.currentCells} maxLength={puzzle.answerLength} onDelete={deleteCell} />
        )}

        {isGameOver && (
          <TouchableOpacity
            style={[styles.resultBanner, state.status === "win" ? styles.winBanner : styles.loseBanner]}
            onPress={() => setShowResult(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.resultBannerText, state.status === "win" ? styles.winText : styles.loseText]}>
              결과 보기 →
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
          onSubmit={() => void handleSubmit()}
        />
      </ScrollView>

      {/* PLAYER-Action Frame flash overlay on submit */}
      {submitFlash !== null && (
        <View style={styles.actionFlash} pointerEvents="none">
          <Image
            source={submitFlash === 0
              ? require('../../../assets/sprites/PLAYER-Action Frame_1.png')
              : require('../../../assets/sprites/PLAYER-Action Frame_2.png')}
            style={{ width: ACTION_FRAME_H * (244 / 281), height: ACTION_FRAME_H }}
            resizeMode="contain"
          />
        </View>
      )}

      <StepResultModal
        visible={showResult}
        solved={state.status === "win"}
        isBoss={isBoss}
        attemptCount={state.attemptCount}
        onClose={() => setShowResult(false)}
        onRetry={() => { setShowResult(false); onRetry(); }}
        onNextStep={() => { setShowResult(false); onNextStep(); }}
        onBack={onBack}
      />
    </View>
  );
}

function StepResultModal({
  visible, solved, isBoss, attemptCount, onClose, onRetry, onNextStep, onBack,
}: {
  visible: boolean; solved: boolean; isBoss: boolean; attemptCount: number;
  onClose: () => void; onRetry: () => void; onNextStep: () => void; onBack: () => void;
}) {
  // PLAYER-WinSuccess Pose: 682×272 → display 220×88
  // PLAYER-LoseHurt Pose:   677×279 → display 220×90
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modal.backdrop}>
        <View style={modal.sheet}>
          {/* Player pose — Win/Lose */}
          <Image
            source={solved
              ? require('../../../assets/sprites/PLAYER-WinSuccess Pose.png')
              : require('../../../assets/sprites/PLAYER-LoseHurt Pose.png')}
            style={solved ? modal.poseWin : modal.poseLose}
            resizeMode="contain"
          />

          {/* Star rating */}
          <View style={modal.starRow}>
            {[0, 1, 2].map((i) => (
              <Image
                key={i}
                source={require('../../../assets/sprites/result-star.png')}
                style={[modal.star, { opacity: solved ? (i < Math.max(1, 4 - Math.floor(attemptCount / 2)) ? 1 : 0.2) : 0.15 }]}
                resizeMode="contain"
              />
            ))}
          </View>

          <Text style={modal.headline}>
            {solved ? (isBoss ? 'STAGE CLEAR!' : 'CORRECT!') : 'GAME OVER'}
          </Text>
          <Text style={modal.sub}>
            {solved
              ? isBoss
                ? `보스를 ${attemptCount}번 만에 클리어!`
                : `${attemptCount}번 만에 정답!`
              : '다른 퍼즐로 다시 도전해보세요.'}
          </Text>

          {solved && (
            <TouchableOpacity style={[modal.btn, modal.btnPrimary]} onPress={onNextStep} activeOpacity={0.8}>
              <Text style={modal.btnTextPrimary}>{isBoss ? '다음 스테이지 →' : '다음 스텝 →'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[modal.btn, modal.btnSecondary]} onPress={onRetry} activeOpacity={0.8}>
            <Text style={modal.btnText}>{solved ? '다시 도전' : '다른 문제로 재도전'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[modal.btn, modal.btnGhost]} onPress={onBack} activeOpacity={0.7}>
            <Text style={modal.btnTextGhost}>← 맵으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gameBg },
  container: { flex: 1, backgroundColor: Colors.gameBg },

  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1e2d4a',
    backgroundColor: '#080e1c',
    gap: 10,
  },
  backBtn: { padding: 2 },
  logo: { width: 100, height: 28 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepCode: { fontSize: 14, fontFamily: 'DungGeunMo', fontWeight: '700', color: Colors.gameText, letterSpacing: 1 },
  bossTag: {
    backgroundColor: 'rgba(69,26,3,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.6)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bossTagText: { fontSize: 10, fontWeight: '700', color: '#FCD34D', fontFamily: 'DungGeunMo' },
  attemptWrap: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  attemptText: { fontSize: 14, fontWeight: '700', color: Colors.gameMuted, fontFamily: 'DungGeunMo' },
  attemptSep: { fontSize: 12, color: '#1e2d4a', marginHorizontal: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 8, gap: 10, paddingBottom: 32 },

  resultBanner: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  winBanner:  { backgroundColor: 'rgba(22,101,52,0.3)', borderColor: 'rgba(34,197,94,0.6)' },
  loseBanner: { backgroundColor: 'rgba(127,29,29,0.2)', borderColor: 'rgba(239,68,68,0.5)' },
  resultBannerText: { fontSize: 15, fontWeight: '700', fontFamily: 'DungGeunMo' },
  winText:  { color: '#86efac' },
  loseText: { color: '#fca5a5' },

  actionFlash: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    zIndex: 100,
  },
});

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0f1729',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#1e2d4a',
    padding: 24,
    paddingBottom: 40,
    gap: 10,
    alignItems: 'center',
  },
  poseWin:  { width: 220, height: 88,  marginBottom: 4 },
  poseLose: { width: 220, height: 90,  marginBottom: 4, opacity: 0.9 },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  star: { width: 28, height: 28 },
  headline: { fontSize: 26, fontWeight: '900', color: Colors.gameText, fontFamily: 'DungGeunMo', letterSpacing: 2 },
  sub: { fontSize: 13, color: Colors.gameTextMuted, marginBottom: 6, textAlign: 'center' },
  btn: { width: '100%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 2 },
  btnPrimary: { backgroundColor: '#22c55e', borderColor: '#16a34a' },
  btnSecondary: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)' },
  btnGhost: { backgroundColor: 'transparent', borderColor: '#1e2d4a' },
  btnText: { fontSize: 15, fontWeight: '700', color: Colors.gameText, fontFamily: 'DungGeunMo' },
  btnTextPrimary: { fontSize: 15, fontWeight: '900', color: '#052e16', fontFamily: 'DungGeunMo' },
  btnTextGhost: { fontSize: 14, fontWeight: '600', color: Colors.gameMuted, fontFamily: 'DungGeunMo' },
});
