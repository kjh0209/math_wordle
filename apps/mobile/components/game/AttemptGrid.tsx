import { View, StyleSheet, Dimensions } from "react-native";
import { AttemptRow } from "./AttemptRow";
import type { GuessRow, TokenUnit } from "@mathdle/core";

interface AttemptGridProps {
  tokenLength: number;
  maxAttempts: number;
  rows: GuessRow[];
  currentTokens: TokenUnit[];
  isInvalid?: boolean;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_GRID_WIDTH = SCREEN_WIDTH - 32;

function buildDisplayRows(
  rows: GuessRow[],
  currentTokens: TokenUnit[],
  maxAttempts: number,
): GuessRow[] {
  const result: GuessRow[] = [];

  // Submitted rows
  for (const row of rows) {
    result.push(row);
  }

  // Active row (current input)
  if (result.length < maxAttempts) {
    result.push({
      tokens: currentTokens,
      feedback: [],
      status: "active",
    });
  }

  // Empty rows
  while (result.length < maxAttempts) {
    result.push({ tokens: [], feedback: [], status: "empty" });
  }

  return result;
}

export function AttemptGrid({
  tokenLength,
  maxAttempts,
  rows,
  currentTokens,
  isInvalid = false,
}: AttemptGridProps) {
  const tileSize = Math.min(
    Math.floor((MAX_GRID_WIDTH - tokenLength * 4) / tokenLength),
    48,
  );

  const displayRows = buildDisplayRows(rows, currentTokens, maxAttempts);
  const activeIndex = rows.length;

  return (
    <View style={styles.container}>
      {displayRows.map((row, i) => (
        <AttemptRow
          key={i}
          row={row}
          tokenLength={tokenLength}
          tileSize={tileSize}
          isActive={i === activeIndex && rows.length < maxAttempts}
          isInvalid={isInvalid && i === activeIndex}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
  },
});
