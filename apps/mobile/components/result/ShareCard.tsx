import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import type { FeedbackColor } from "@mathdle/core";
import { buildEmojiGrid } from "@mathdle/core";

interface ShareCardProps {
  puzzleTitle: string;
  solved: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  clearTimeMs: number | null;
  rows: FeedbackColor[][];
}

export function ShareCard({
  puzzleTitle,
  solved,
  attemptsUsed,
  maxAttempts,
  clearTimeMs,
  rows,
}: ShareCardProps) {
  const score = solved ? `${attemptsUsed}/${maxAttempts}` : `X/${maxAttempts}`;
  const emojiGrid = buildEmojiGrid(rows);
  const timeStr = clearTimeMs
    ? clearTimeMs < 60_000
      ? `${(clearTimeMs / 1000).toFixed(1)}초`
      : `${Math.floor(clearTimeMs / 60_000)}:${Math.floor((clearTimeMs % 60_000) / 1000).toString().padStart(2, "0")}`
    : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {puzzleTitle} {score}
      </Text>
      <Text style={styles.emoji}>{emojiGrid}</Text>
      {timeStr && <Text style={styles.time}>⏱ {timeStr}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.gameSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.gameText,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 30,
    textAlign: "center",
  },
  time: {
    fontSize: 13,
    color: Colors.gameTextMuted,
  },
});
