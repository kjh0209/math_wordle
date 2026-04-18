/**
 * apps/mobile — Stage Detail
 * Shows the 10 steps for a stage with locked/unlocked/cleared state.
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { getStageByNum, getStepsForStage } from "@mathdle/core";
import type { Stage, StageStep } from "@mathdle/core";
import { getClearedSteps, isStepUnlocked } from "../../utils/progress";
import { getAdminMode } from "../../utils/adminMode";

interface StepNode {
  step: StageStep;
  cleared: boolean;
  unlocked: boolean;
}

export default function StageDetailScreen() {
  const { stageNum } = useLocalSearchParams<{ stageNum: string }>();
  const router = useRouter();
  const num = Number(stageNum);

  const [stage, setStage] = useState<Stage | null>(null);
  const [nodes, setNodes] = useState<StepNode[]>([]);

  useEffect(() => {
    const s = getStageByNum(num);
    setStage(s);
    const steps = getStepsForStage(num);

    Promise.all([getClearedSteps(), getAdminMode()]).then(([cleared, admin]) => {
      const mapped: StepNode[] = steps.map((step) => ({
        step,
        cleared: cleared.has(step.code),
        unlocked: admin || isStepUnlocked(num, step.stepNumber, cleared),
      }));
      setNodes(mapped);
    });
  }, [num]);

  if (!stage) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.brand} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const clearedCount = nodes.filter((n) => n.cleared).length;
  const pct = nodes.length > 0 ? Math.round((clearedCount / nodes.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/" as never)} style={styles.backBtn}>
          <Text style={styles.backText}>← 스테이지 맵</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stage card */}
        <View style={styles.stageCard}>
          <Text style={styles.stageLabel}>STAGE {stage.stageNumber}</Text>
          <Text style={styles.stageTitle}>{stage.title}</Text>
          {stage.description ? (
            <Text style={styles.stageDesc}>{stage.description}</Text>
          ) : null}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>
              {clearedCount}/{nodes.length}
            </Text>
          </View>
        </View>

        {/* Step list */}
        {nodes.map((node) => (
          <StepCard
            key={node.step.id}
            node={node}
            onPress={() => {
              if (node.unlocked) {
                router.push(`/step/${node.step.code}` as never);
              }
            }}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StepCard({
  node,
  onPress,
}: {
  node: StepNode;
  onPress: () => void;
}) {
  const { step, cleared, unlocked } = node;
  const isBoss = step.isBoss;

  return (
    <TouchableOpacity
      style={[
        styles.stepCard,
        isBoss && unlocked && styles.stepCardBoss,
        cleared && styles.stepCardCleared,
        !unlocked && styles.stepCardLocked,
      ]}
      onPress={onPress}
      activeOpacity={unlocked ? 0.75 : 1}
      disabled={!unlocked}
    >
      {/* Icon */}
      <View
        style={[
          styles.stepIcon,
          cleared
            ? styles.stepIconCleared
            : isBoss
            ? styles.stepIconBoss
            : unlocked
            ? styles.stepIconUnlocked
            : styles.stepIconLocked,
        ]}
      >
        <Text style={styles.stepIconText}>
          {cleared ? "✓" : !unlocked ? "🔒" : isBoss ? "👑" : String(step.stepNumber)}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.stepInfo}>
        <View style={styles.stepInfoTop}>
          <Text style={styles.stepCode}>{step.code}</Text>
          {isBoss && <Text style={styles.bossTag}>BOSS</Text>}
          {cleared && <Text style={styles.clearedTag}>클리어</Text>}
        </View>
        <Text
          style={[styles.stepTitle, !unlocked && styles.stepTitleLocked]}
          numberOfLines={1}
        >
          {step.title}
        </Text>
        {step.difficulty && (
          <Text style={styles.stepDiff}>{diffLabel(step.difficulty)}</Text>
        )}
      </View>

      {unlocked && !cleared && (
        <Text style={styles.stepArrow}>→</Text>
      )}
    </TouchableOpacity>
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 12 },

  stageCard: {
    backgroundColor: Colors.gameCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.brand + "55",
    padding: 20,
    marginBottom: 4,
    gap: 6,
  },
  stageLabel: { fontSize: 10, fontWeight: "700", color: Colors.brand, letterSpacing: 2 },
  stageTitle: { fontSize: 22, fontWeight: "900", color: Colors.gameText },
  stageDesc: { fontSize: 13, color: Colors.gameTextMuted },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  progressTrack: { flex: 1, height: 6, backgroundColor: Colors.gameBg, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.brand, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: Colors.gameTextMuted, minWidth: 32, textAlign: "right" },

  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.gameCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    padding: 14,
  },
  stepCardBoss: { borderColor: "#F59E0B88", backgroundColor: "#451A0310" },
  stepCardCleared: { borderColor: "#16A34A55" },
  stepCardLocked: { opacity: 0.45 },

  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  stepIconUnlocked: { backgroundColor: Colors.gameBg, borderColor: Colors.gameBorder },
  stepIconLocked: { backgroundColor: Colors.gameBg, borderColor: Colors.gameBorder + "80" },
  stepIconCleared: { backgroundColor: "#14532D30", borderColor: "#16A34A80" },
  stepIconBoss: { backgroundColor: "#451A0330", borderColor: "#F59E0B80" },
  stepIconText: { fontSize: 14, fontWeight: "700", color: Colors.gameText },

  stepInfo: { flex: 1, gap: 2 },
  stepInfoTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepCode: { fontSize: 11, fontFamily: "monospace", color: Colors.gameMuted },
  bossTag: {
    fontSize: 10, fontWeight: "700",
    backgroundColor: "#451A0340", color: "#F59E0B",
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4, borderWidth: 1, borderColor: "#F59E0B50",
  },
  clearedTag: {
    fontSize: 10,
    backgroundColor: "#14532D30", color: "#4ADE80",
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4, borderWidth: 1, borderColor: "#16A34A40",
  },
  stepTitle: { fontSize: 15, fontWeight: "700", color: Colors.gameText },
  stepTitleLocked: { color: Colors.gameTextMuted },
  stepDiff: { fontSize: 11, color: Colors.gameMuted },
  stepArrow: { fontSize: 18, color: Colors.brand },
});
