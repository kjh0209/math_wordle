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
  ImageBackground,
  Image,
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
      <View style={{ flex: 1, backgroundColor: Colors.gameBg }}>
        <ActivityIndicator color={Colors.warning} style={{ marginTop: 60 }} />
      </View>
    );
  }

  const clearedCount = nodes.filter((n) => n.cleared).length;
  const pct = nodes.length > 0 ? Math.round((clearedCount / nodes.length) * 100) : 0;

  return (
    <ImageBackground source={require('../../assets/sprites/map-bg.png')} resizeMode="repeat" style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/' as never)} style={styles.backBtn}>
            <Image source={require('../../assets/sprites/mathle_logo.png')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/' as never)} style={styles.backArrow}>
            <Text style={styles.backArrowText}>← 맵으로</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stage card */}
          <View style={styles.stageCard}>
            <Text style={styles.stageLabel}>WORLD {stage.stageNumber}</Text>
            <Text style={styles.stageTitle}>{stage.title}</Text>
            {stage.description ? (
              <Text style={styles.stageDesc}>{stage.description}</Text>
            ) : null}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
              </View>
              <Text style={styles.progressLabel}>{clearedCount}/{nodes.length}</Text>
            </View>
          </View>

          {/* Step list */}
          {nodes.map((node) => (
            <StepCard
              key={node.step.id}
              node={node}
              onPress={() => {
                if (node.unlocked) router.push(`/step/${node.step.code}` as never);
              }}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function StepCard({ node, onPress }: { node: StepNode; onPress: () => void }) {
  const { step, cleared, unlocked } = node;
  const isBoss = step.isBoss;

  let nodeSource;
  if (isBoss) {
    nodeSource = cleared
      ? require('../../assets/sprites/node-boss-cleared.png')
      : unlocked
      ? require('../../assets/sprites/node-boss-active.png')
      : require('../../assets/sprites/node-boss-locked.png');
  } else {
    nodeSource = cleared
      ? require('../../assets/sprites/node-normal-cleared.png')
      : unlocked
      ? require('../../assets/sprites/node-normal-unlocked.png')
      : require('../../assets/sprites/node-normal-locked.png');
  }

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
      <Image source={nodeSource} style={styles.nodeIcon} resizeMode="contain" />

      <View style={styles.stepInfo}>
        <View style={styles.stepInfoTop}>
          <Text style={[styles.stepCode, isBoss && styles.stepCodeBoss]}>{step.code}</Text>
          {isBoss && <View style={styles.bossTag}><Text style={styles.bossTagText}>BOSS</Text></View>}
          {cleared && <View style={styles.clearedTag}><Text style={styles.clearedTagText}>CLEAR</Text></View>}
        </View>
        <Text style={[styles.stepTitle, !unlocked && styles.stepTitleLocked]} numberOfLines={1}>
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
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1e2d4a',
    backgroundColor: 'rgba(8,14,28,0.85)',
  },
  backBtn: {},
  logo: { width: 120, height: 32 },
  backArrow: { padding: 4 },
  backArrowText: { fontSize: 13, color: '#eab308', fontFamily: 'DungGeunMo', fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60, gap: 10 },

  stageCard: {
    backgroundColor: 'rgba(19,31,53,0.9)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.4)',
    padding: 16,
    marginBottom: 4,
    gap: 6,
  },
  stageLabel: { fontSize: 10, fontWeight: '700', color: '#6366f1', letterSpacing: 3, fontFamily: 'DungGeunMo' },
  stageTitle: { fontSize: 20, fontWeight: '900', color: Colors.gameText, fontFamily: 'DungGeunMo' },
  stageDesc: { fontSize: 12, color: Colors.gameTextMuted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  progressTrack: { flex: 1, height: 8, backgroundColor: '#0f1729', borderWidth: 1, borderColor: '#1e2d4a', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366f1' },
  progressLabel: { fontSize: 12, color: Colors.gameMuted, fontFamily: 'DungGeunMo', minWidth: 32, textAlign: 'right' },

  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(19,31,53,0.85)',
    borderWidth: 2,
    borderColor: '#1e2d4a',
    borderRadius: 10,
    padding: 12,
  },
  stepCardBoss: { borderColor: 'rgba(245,158,11,0.5)', backgroundColor: 'rgba(69,26,3,0.25)' },
  stepCardCleared: { borderColor: 'rgba(22,163,74,0.5)' },
  stepCardLocked: { opacity: 0.4 },

  nodeIcon: { width: 48, height: 48 },

  stepInfo: { flex: 1, gap: 2 },
  stepInfoTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepCode: { fontSize: 11, fontFamily: 'DungGeunMo', color: '#eab308', letterSpacing: 1 },
  stepCodeBoss: { color: '#FCD34D' },
  bossTag: {
    backgroundColor: 'rgba(69,26,3,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.5)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  bossTagText: { fontSize: 9, fontWeight: '700', color: '#FCD34D', fontFamily: 'DungGeunMo' },
  clearedTag: {
    backgroundColor: 'rgba(20,83,45,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.5)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  clearedTagText: { fontSize: 9, fontWeight: '700', color: '#4ade80', fontFamily: 'DungGeunMo' },
  stepTitle: { fontSize: 14, fontWeight: '700', color: Colors.gameText, fontFamily: 'DungGeunMo' },
  stepTitleLocked: { color: Colors.gameTextMuted },
  stepDiff: { fontSize: 11, color: Colors.gameMuted },
  stepArrow: { fontSize: 18, color: '#eab308', fontFamily: 'DungGeunMo' },
});
