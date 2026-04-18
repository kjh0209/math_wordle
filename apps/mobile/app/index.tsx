/**
 * apps/mobile — Stage Map (Home)
 */

import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { getAllStages, getStepsForStage } from "@mathdle/core";
import type { Stage } from "@mathdle/core";
import { getClearedSteps, isStageUnlocked } from "../utils/progress";
import { getAdminMode, setAdminMode } from "../utils/adminMode";

interface StageNode {
  stage: Stage;
  totalSteps: number;
  clearedSteps: number;
  unlocked: boolean;
}

export default function StageMapScreen() {
  const router = useRouter();
  const [nodes, setNodes] = useState<StageNode[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = useCallback(async () => {
    const [cleared, admin] = await Promise.all([getClearedSteps(), getAdminMode()]);
    setIsAdmin(admin);
    const stages = getAllStages();
    const mapped: StageNode[] = stages.map((stage) => {
      const steps = getStepsForStage(stage.stageNumber);
      const clearedCount = steps.filter((s) => cleared.has(s.code)).length;
      return {
        stage,
        totalSteps: steps.length,
        clearedSteps: clearedCount,
        unlocked: admin || isStageUnlocked(stage.stageNumber, cleared),
      };
    });
    setNodes(mapped);
  }, []);

  // Reload on every screen focus (e.g., returning from a stage)
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const switchMode = async (admin: boolean) => {
    await setAdminMode(admin);
    setIsAdmin(admin);
    loadData();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>🧮</Text>
          <View>
            <Text style={styles.brand}>Mathdle</Text>
            <Text style={styles.subtitle}>스테이지를 선택하세요</Text>
          </View>
        </View>

        {/* Mode toggle */}
        <View style={styles.modePill}>
          <TouchableOpacity
            style={[styles.modeBtn, !isAdmin && styles.modeBtnActive]}
            onPress={() => switchMode(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeBtnText, !isAdmin && styles.modeBtnTextActive]}>
              일반
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, isAdmin && styles.modeBtnAdminActive]}
            onPress={() => switchMode(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeBtnText, isAdmin && styles.modeBtnTextActive]}>
              관리자
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isAdmin && (
        <View style={styles.adminBanner}>
          <Text style={styles.adminBannerText}>🔑 관리자 모드 — 모든 스테이지 개방됨</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {nodes.length === 0 ? (
          <ActivityIndicator color={Colors.brand} style={{ marginTop: 60 }} />
        ) : (
          nodes.map((node) => (
            <StageCard
              key={node.stage.id}
              node={node}
              onPress={() => {
                if (node.unlocked) {
                  router.push(`/stage/${node.stage.stageNumber}` as never);
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
  safe: { flex: 1, backgroundColor: Colors.gameBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gameBorder,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { fontSize: 32 },
  brand: { fontSize: 20, fontWeight: "900", color: Colors.gameText, letterSpacing: 2 },
  subtitle: { fontSize: 11, color: Colors.gameTextMuted, marginTop: 1 },

  modePill: {
    flexDirection: "row",
    backgroundColor: Colors.gameBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    overflow: "hidden",
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  modeBtnActive: { backgroundColor: Colors.brand },
  modeBtnAdminActive: { backgroundColor: "#F59E0B" },
  modeBtnText: { fontSize: 12, fontWeight: "700", color: Colors.gameTextMuted },
  modeBtnTextActive: { color: "#fff" },

  adminBanner: {
    backgroundColor: "#451A0320",
    borderBottomWidth: 1,
    borderBottomColor: "#F59E0B30",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  adminBannerText: { fontSize: 12, color: "#FCD34D", textAlign: "center" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 14 },
  card: {
    backgroundColor: Colors.gameCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.brand + "66",
    padding: 20,
    gap: 12,
  },
  cardLocked: { borderColor: Colors.gameBorder, opacity: 0.55 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  cardRight: { alignItems: "flex-end" },
  cardStageLabel: { fontSize: 10, fontWeight: "700", color: Colors.brand, letterSpacing: 2 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: Colors.gameText },
  cardTitleLocked: { color: Colors.gameTextMuted },
  cardDesc: { fontSize: 13, color: Colors.gameTextMuted, lineHeight: 18 },
  cardPct: { fontSize: 28, fontWeight: "900", color: Colors.brand },
  lockIcon: { fontSize: 28 },
  progressTrack: { height: 6, backgroundColor: Colors.gameBg, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.brand, borderRadius: 3 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardFooterText: { fontSize: 12, color: Colors.gameTextMuted },
  cardArrow: { fontSize: 16, color: Colors.brand, fontWeight: "700" },
  footer: { textAlign: "center", fontSize: 12, color: Colors.gameMuted, marginTop: 8 },
});
