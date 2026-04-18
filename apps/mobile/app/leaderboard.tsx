/**
 * apps/mobile — Leaderboard screen
 * Shows daily leaderboard with filter tabs.
 */

import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/ui/AppHeader";
import { ErrorState } from "../components/ui/ErrorState";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";
import { usePuzzleLoader } from "../hooks/usePuzzleLoader";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { Colors } from "../constants/Colors";
import type { LeaderboardFilter } from "@mathdle/core";

const FILTER_OPTIONS: { key: LeaderboardFilter; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "all-time", label: "전체" },
  { key: "practice", label: "연습" },
];

export default function LeaderboardScreen() {
  // Load today's puzzle to get its ID for the leaderboard
  const { puzzle, loading: puzzleLoading } = usePuzzleLoader("daily");
  const puzzleId = puzzle?.id ?? "";

  const { loadState, filter, changeFilter, refresh } = useLeaderboard(
    puzzleId,
    "today",
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="리더보드" />

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.tab, filter === opt.key && styles.activeTab]}
            onPress={() => changeFilter(opt.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                filter === opt.key && styles.activeTabText,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats bar */}
      {loadState.status === "ready" && (
        <View style={styles.statsBar}>
          <StatItem label="전체 플레이어" value={loadState.data.stats.totalPlayers} />
          <StatItem label="클리어" value={loadState.data.stats.totalClears} />
          <StatItem
            label="최고 시도"
            value={loadState.data.stats.bestAttemptsCount ?? "-"}
          />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {puzzleLoading || loadState.status === "loading" ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.brand} />
          </View>
        ) : loadState.status === "error" ? (
          <ErrorState message={loadState.message} onRetry={refresh} />
        ) : loadState.status === "ready" ? (
          <LeaderboardTable entries={loadState.data.entries} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{String(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gameBg,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.gameCard,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gameBorder,
  },
  activeTab: {
    backgroundColor: Colors.brand + "22",
    borderColor: Colors.brand,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.gameMuted,
  },
  activeTabText: {
    color: Colors.brand,
  },
  statsBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: Colors.gameCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.gameText,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.gameMuted,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
