import { View, StyleSheet, Dimensions } from "react-native";
import { TokenTile } from "./TokenTile";
import type { GuessRow, TileState, TokenUnit } from "@mathdle/core";

interface AttemptRowProps {
  row: GuessRow;
  tokenLength: number;
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
  if (isActive && index < row.tokens.length) return "active";
  return "empty";
}

export function AttemptRow({
  row,
  tokenLength,
  tileSize,
  isActive = false,
  isInvalid = false,
}: AttemptRowProps) {
  const tiles = Array.from({ length: tokenLength }, (_, i) => {
    const token = row.tokens[i];
    const display = token?.display ?? "";
    const state = getTileState(row, i, isActive, isInvalid);
    return (
      <TokenTile key={i} display={display} state={state} size={tileSize} />
    );
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
