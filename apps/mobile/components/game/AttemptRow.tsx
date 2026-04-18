import { View, StyleSheet } from "react-native";
import { TokenTile } from "./TokenTile";
import type { GuessRow, TileState } from "@mathdle/core";
import { getTokenDisplay, getBlockDisplay } from "@mathdle/core";

interface AttemptRowProps {
  row: GuessRow;
  answerLength: number;
  tileSize: number;
  isActive?: boolean;
  isInvalid?: boolean;
}

function getTileState(
  row: GuessRow,
  index: number,
  isActive: boolean,
  isInvalid: boolean,
): TileState {
  if (row.status === "submitted") {
    return row.feedback[index] ?? "absent";
  }
  if (isActive && isInvalid) return "invalid";
  if (isActive && index < row.cells.length) return "active";
  return "empty";
}

function getCellDisplay(row: GuessRow, index: number): string {
  const cell = row.cells[index];
  if (!cell) return "";
  if (cell.type === "token") return getTokenDisplay(cell.value);
  return getBlockDisplay(cell.blockType, cell.fields);
}

export function AttemptRow({
  row,
  answerLength,
  tileSize,
  isActive = false,
  isInvalid = false,
}: AttemptRowProps) {
  const tiles = Array.from({ length: answerLength }, (_, i) => {
    const display = getCellDisplay(row, i);
    const state = getTileState(row, i, isActive, isInvalid);
    return <TokenTile key={i} display={display} state={state} size={tileSize} />;
  });

  return <View style={styles.row}>{tiles}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 2,
  },
});
