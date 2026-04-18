import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import type { PuzzleViewModel } from "@mathdle/core";

interface PuzzleHeaderCardProps {
  puzzle: PuzzleViewModel;
  attemptCount: number;
}

const DIFF_COLORS: Record<string, string> = {
  easy: Colors.success,
  medium: Colors.warning,
  hard: Colors.error,
  expert: "#a855f7",
};

export function PuzzleHeaderCard({ puzzle, attemptCount }: PuzzleHeaderCardProps) {
  const diffColor = DIFF_COLORS[puzzle.difficulty] ?? Colors.gameTextMuted;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{puzzle.title}</Text>
        <View style={[styles.badge, { borderColor: diffColor }]}>
          <Text style={[styles.badgeText, { color: diffColor }]}>
            {puzzle.difficulty}
          </Text>
        </View>
      </View>

      {puzzle.displayInfo.hint && (
        <Text style={styles.hint}>{puzzle.displayInfo.hint}</Text>
      )}

      <View style={styles.statsRow}>
        <Text style={styles.stat}>
          시도 {attemptCount}/{puzzle.maxAttempts}
        </Text>
        <Text style={styles.stat}>길이 {puzzle.tokenLength}</Text>
        {puzzle.isDaily && (
          <View style={styles.dailyBadge}>
            <Text style={styles.dailyText}>오늘의 퍼즐</Text>
          </View>
        )}
      </View>

      {puzzle.displayInfo.context && (
        <View style={styles.contextRow}>
          {Object.entries(puzzle.displayInfo.context).map(([key, val]) => (
            <View key={key} style={styles.contextChip}>
              <Text style={styles.contextKey}>{key}</Text>
              <Text style={styles.contextVal}>{String(val)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gameCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    padding: 16,
    marginHorizontal: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.gameText,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  hint: {
    fontSize: 13,
    color: Colors.gameTextMuted,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  stat: {
    fontSize: 12,
    color: Colors.gameMuted,
    fontWeight: "500",
  },
  dailyBadge: {
    backgroundColor: Colors.brand + "22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dailyText: {
    fontSize: 11,
    color: Colors.brand,
    fontWeight: "600",
  },
  contextRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  contextChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gameSurface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  contextKey: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.brand,
  },
  contextVal: {
    fontSize: 13,
    color: Colors.gameText,
    fontWeight: "500",
  },
});
