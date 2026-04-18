/**
 * apps/mobile — Stage Map (Home)
 * World map showing all stages, progression, locked/unlocked state.
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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { getMockStages, getMockStepsForStage } from "@mathdle/core";
import type { Stage } from "@mathdle/core";

interface StageNode {
  stage: Stage;
  totalSteps: number;
  clearedSteps: number; // 0 until Supabase progress is wired
  unlocked: boolean;
}

export default function StageMapScreen() {
  const router = useRouter();
  const [nodes, setNodes] = useState<StageNode[]>([]);

  useEffect(() => {
    // Load mock stages — swap for API call when Supabase is ready
    const stages = getMockStages();
    const mapped: StageNode[] = stages.map((stage, idx) => ({
      stage,
      totalSteps: getMockStepsForStage(stage.id).length,
      clearedSteps: 0, // TODO: load from local progress store
      unlocked: idx === 0, // first stage always unlocked
    }));
    setNodes(mapped);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🧮</Text>
        <View>
          <Text style={styles.brand}>Mathdle</Text>
          <Text style={styles.subtitle}>스테이지를 선택하세요</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {nodes.length === 0 ? (
          <ActivityIndicator color={Colors.brand} style={{ marginTop: 60 }} />
        ) : (
          nodes.map((node, idx) => (
            <StageCard
              key={node.stage.id}
              node={node}
              onPress={() => {
                if (node.unlocked) {
                  router.push(`/stage/${node.stage.id}` as never);
                }
              }}
            />
          ))
        )}

        <Text style={styles.footer}>
          스테이지를 클리어하며 수학 실력을 키워보세요 📐
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StageCard({ node, onPress }: { node: StageNode; onPress: () => void }) {
  const { stage, totalSteps, clearedSteps, unlocked } = node;
  const pct = totalSteps > 0 ? Math.round((clearedSteps / totalSteps) * 100) : 0;

  return (
    <TouchableOpacity
      style={[styles.card, !unlocked && styles.cardLocked]}
      onPress={onPress}
      activeOpacity={unlocked ? 0.75 : 1}
      disabled={!unlocked}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardStageLabel}>STAGE {stage.stageNumber}</Text>
          <Text style={[styles.cardTitle, !unlocked && styles.cardTitleLocked]}>
            {stage.title}
          </Text>
          {stage.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {stage.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          {unlocked ? (
            <Text style={styles.cardPct}>{pct}%</Text>
          ) : (
            <Text style={styles.lockIcon}>🔒</Text>
          )}
        </View>
      </View>

      {unlocked && (
        <>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>
              {clearedSteps} / {totalSteps} 스텝 클리어
            </Text>
            <Text style={styles.cardArrow}>→</Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gameBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gameBorder,
  },
  logo: {
    fontSize: 36,
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.gameText,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.gameTextMuted,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.gameCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.brand + "66",
    padding: 20,
    gap: 12,
  },
  cardLocked: {
    borderColor: Colors.gameBorder,
    opacity: 0.55,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  cardStageLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.brand,
    letterSpacing: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.gameText,
  },
  cardTitleLocked: {
    color: Colors.gameTextMuted,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.gameTextMuted,
    lineHeight: 18,
  },
  cardPct: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.brand,
  },
  lockIcon: {
    fontSize: 28,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.gameBg,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.brand,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardFooterText: {
    fontSize: 12,
    color: Colors.gameTextMuted,
  },
  cardArrow: {
    fontSize: 16,
    color: Colors.brand,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.gameMuted,
    marginTop: 8,
  },
});
