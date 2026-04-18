import { View, StyleSheet, Dimensions } from "react-native";
import { AttemptRow } from "./AttemptRow";
import type { GuessRow, PuzzleCell } from "@mathdle/core";

interface AttemptGridProps {
  answerLength: number;
  maxAttempts: number;
  rows: GuessRow[];
  currentCells: PuzzleCell[];
  isInvalid?: boolean;
  focusedPath?: (string | number)[] | null;
  setFocusedPath?: (path: (string | number)[] | null) => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_GRID_WIDTH = SCREEN_WIDTH - 32;

function buildDisplayRows(
  rows: GuessRow[],
  currentCells: PuzzleCell[],
  maxAttempts: number,
): GuessRow[] {
  const result: GuessRow[] = [];

  for (const row of rows) {
    result.push(row);
  }

  if (result.length < maxAttempts) {
    result.push({ cells: currentCells, feedback: [], status: "active" });
  }

  while (result.length < maxAttempts) {
    result.push({ cells: [], feedback: [], status: "empty" });
  }

  return result;
}

export function AttemptGrid({
  answerLength,
  maxAttempts,
  rows,
  currentCells,
  isInvalid = false,
  focusedPath = null,
  setFocusedPath,
}: AttemptGridProps) {
  const tileSize = Math.min(
    Math.floor((MAX_GRID_WIDTH - answerLength * 4) / answerLength),
    48,
  );

  const displayRows = buildDisplayRows(rows, currentCells, maxAttempts);
  const activeIndex = rows.length;

  return (
    <View style={styles.container}>
      {displayRows.map((row, i) => (
        <AttemptRow
          key={i}
          row={row}
          answerLength={answerLength}
          tileSize={tileSize}
          isActive={i === activeIndex && rows.length < maxAttempts}
          isInvalid={isInvalid && i === activeIndex}
          focusedPath={i === activeIndex ? focusedPath : null}
          setFocusedPath={i === activeIndex ? setFocusedPath : undefined}
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
