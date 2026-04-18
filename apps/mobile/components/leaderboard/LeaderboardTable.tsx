import { View, Text, FlatList, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import type { LeaderboardEntry } from "@mathdle/core";
import { formatTime } from "@mathdle/core";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

function RankBadge({ rank }: { rank: number }) {
  const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
  if (medals[rank]) {
    return <Text style={styles.medal}>{medals[rank]}</Text>;
  }
  return <Text style={styles.rank}>#{rank}</Text>;
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyText}>아직 기록이 없습니다.</Text>
        <Text style={styles.emptySub}>첫 번째 클리어를 달성해보세요!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => `${item.sessionId}-${item.rank}`}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rankCol}>
            <RankBadge rank={item.rank} />
          </View>
          <View style={styles.nameCol}>
            <Text style={styles.name} numberOfLines={1}>
              {item.displayName}
            </Text>
          </View>
          <View style={styles.statsCol}>
            <Text style={styles.attempts}>{item.attemptsCount}회</Text>
            <Text style={styles.time}>{formatTime(item.clearTimeMs)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gameCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rankCol: {
    width: 40,
    alignItems: "center",
  },
  medal: {
    fontSize: 20,
  },
  rank: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.gameMuted,
  },
  nameCol: {
    flex: 1,
    marginHorizontal: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gameText,
  },
  statsCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  attempts: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.gameText,
  },
  time: {
    fontSize: 11,
    color: Colors.gameTextMuted,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gameTextMuted,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.gameMuted,
  },
});
