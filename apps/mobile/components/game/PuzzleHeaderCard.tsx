import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import type { PuzzleViewModel } from "@mathdle/core";

interface PuzzleHeaderCardProps {
  puzzle: PuzzleViewModel;
  attemptCount: number;
  solved?: boolean;
}

const DIFF_COLORS: Record<string, string> = {
  easy: Colors.success,
  medium: Colors.warning,
  hard: Colors.error,
  expert: "#a855f7",
};

export function PuzzleHeaderCard({ puzzle, attemptCount, solved }: PuzzleHeaderCardProps) {
  const diffColor = DIFF_COLORS[puzzle.difficulty] ?? Colors.gameTextMuted;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{puzzle.title}</Text>
          {puzzle.level && (
            <Text style={styles.level}>
              {puzzle.level.replace(/_/g, " ")}
            </Text>
          )}
        </View>
        <View style={[styles.badge, { borderColor: diffColor }]}>
          <Text style={[styles.badgeText, { color: diffColor }]}>
            {puzzle.difficulty}
          </Text>
        </View>
      </View>

      {solved && puzzle.explanation && (
        <Text style={styles.hint}>💡 {puzzle.explanation}</Text>
      )}

      <View style={styles.statsRow}>
        <Text style={styles.stat}>
          시도 {attemptCount}/{puzzle.maxAttempts}
        </Text>
        <Text style={styles.stat}>길이 {puzzle.answerLength}</Text>
        {puzzle.isDaily && (
          <View style={styles.dailyBadge}>
            <Text style={styles.dailyText}>오늘의 퍼즐</Text>
          </View>
        )}
      </View>

      {puzzle.variable && (
        <View style={styles.contextRow}>
          <View style={styles.contextChip}>
            <Text style={styles.contextKey}>{puzzle.variable.name}</Text>
            <Text style={styles.contextEq}>=</Text>
            <Text style={styles.contextVal}>
              {puzzle.variable.valueDisplay}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(10,17,34,0.9)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1e2d4a',
    padding: 14,
    marginHorizontal: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.gameText,
    fontFamily: 'DungGeunMo',
  },
  level: {
    fontSize: 10,
    color: Colors.gameMuted,
    marginTop: 2,
    textTransform: "capitalize",
    fontFamily: 'DungGeunMo',
    letterSpacing: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    fontFamily: 'DungGeunMo',
    letterSpacing: 1,
  },
  hint: {
    fontSize: 12,
    color: Colors.gameTextMuted,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  stat: {
    fontSize: 11,
    color: Colors.gameMuted,
    fontFamily: 'DungGeunMo',
  },
  dailyBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dailyText: {
    fontSize: 10,
    color: Colors.brand,
    fontWeight: "700",
    fontFamily: 'DungGeunMo',
  },
  contextRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  contextChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#0f1729',
    borderWidth: 1,
    borderColor: '#1e2d4a',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  contextKey: {
    fontSize: 13,
    fontWeight: "700",
    color: '#6366f1',
    fontFamily: 'DungGeunMo',
  },
  contextEq: {
    fontSize: 13,
    color: Colors.gameTextMuted,
  },
  contextVal: {
    fontSize: 13,
    color: Colors.gameText,
    fontWeight: "700",
    fontFamily: 'DungGeunMo',
  },
});
