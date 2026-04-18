/**
 * apps/mobile — Step Intro
 * Shows step info and pool size before starting a game.
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { getStepByCode, PROBLEM_SETS } from "@mathdle/core";
import type { StageStep } from "@mathdle/core";

export default function StepIntroScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [step, setStep] = useState<StageStep | null>(null);
  const [poolSize, setPoolSize] = useState(0);

  useEffect(() => {
    const s = getStepByCode(code);
    setStep(s);
    if (s) {
      const [stageNum, stepNum] = code.split("-").map(Number);
      setPoolSize((PROBLEM_SETS[`${stageNum}-${stepNum}`] ?? []).length);
    }
  }, [code]);

  if (!step) return null;

  const [stageNum] = code.split("-");
  const isBoss = step.isBoss;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace(`/stage/${stageNum}` as never)}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← 스테이지 {stageNum}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Boss banner */}
        {isBoss && (
          <View style={styles.bossBanner}>
            <Text style={styles.bossIcon}>👑</Text>
            <View>
              <Text style={styles.bossTitle}>보스 스텝</Text>
              <Text style={styles.bossDesc}>이 스테이지의 마지막 관문입니다</Text>
            </View>
          </View>
        )}

        {/* Step card */}
        <View style={[styles.card, isBoss && styles.cardBoss]}>
          <View style={styles.codeRow}>
            <Text style={[styles.codeTag, isBoss && styles.codeTagBoss]}>
              {step.code}
            </Text>
          </View>
          <Text style={styles.title}>{step.title}</Text>
          {step.difficulty && (
            <View style={styles.diffRow}>
              <Text style={styles.diffLabel}>난이도</Text>
              <Text style={styles.diffValue}>{diffLabel(step.difficulty)}</Text>
            </View>
          )}
        </View>

        {/* Pool info */}
        <View style={styles.card}>
          <Text style={styles.poolIcon}>🔀</Text>
          <Text style={styles.poolTitle}>
            이 스텝에는 {poolSize}개의 퍼즐 풀이 있습니다
          </Text>
          <Text style={styles.poolDesc}>
            시작할 때마다 아직 풀지 않은 퍼즐이 우선 제공됩니다.
            다시 시도하면 다른 퍼즐이 출제될 수 있어요.
          </Text>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.startBtn, isBoss && styles.startBtnBoss]}
          onPress={() => router.push(`/step/${code}/play` as never)}
          activeOpacity={0.8}
        >
          <Text style={[styles.startBtnText, isBoss && styles.startBtnTextBoss]}>
            ▶ 시작하기
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backCardBtn}
          onPress={() => router.replace(`/stage/${stageNum}` as never)}
          activeOpacity={0.7}
        >
          <Text style={styles.backCardText}>스테이지로 돌아가기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function diffLabel(d: string) {
  return d === "easy" ? "쉬움" : d === "medium" ? "보통" : "어려움";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gameBg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gameBorder,
  },
  backBtn: { alignSelf: "flex-start" },
  backText: { fontSize: 14, color: Colors.brand, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40, gap: 14 },

  bossBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#451A0320",
    borderWidth: 1,
    borderColor: "#F59E0B40",
    borderRadius: 14,
    padding: 14,
  },
  bossIcon: { fontSize: 24 },
  bossTitle: { fontSize: 14, fontWeight: "700", color: "#FCD34D" },
  bossDesc: { fontSize: 12, color: "#F59E0B80", marginTop: 2 },

  card: {
    backgroundColor: Colors.gameCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    padding: 18,
    gap: 8,
  },
  cardBoss: { borderColor: "#F59E0B40" },

  codeRow: { flexDirection: "row" },
  codeTag: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "700",
    color: Colors.brand,
    backgroundColor: Colors.brand + "18",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.brand + "30",
  },
  codeTagBoss: {
    color: "#FCD34D",
    backgroundColor: "#451A0330",
    borderColor: "#F59E0B40",
  },
  title: { fontSize: 22, fontWeight: "800", color: Colors.gameText },
  diffRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  diffLabel: { fontSize: 12, color: Colors.gameMuted },
  diffValue: { fontSize: 12, color: Colors.gameTextMuted, fontWeight: "600" },

  poolIcon: { fontSize: 20 },
  poolTitle: { fontSize: 14, fontWeight: "700", color: Colors.gameText },
  poolDesc: { fontSize: 13, color: Colors.gameTextMuted, lineHeight: 20 },

  startBtn: {
    backgroundColor: Colors.brand,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  startBtnBoss: { backgroundColor: "#F59E0B" },
  startBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  startBtnTextBoss: { color: "#000" },

  backCardBtn: {
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  backCardText: { fontSize: 14, color: Colors.gameTextMuted },
});
