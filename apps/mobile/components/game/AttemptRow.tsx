import { View, TouchableOpacity, StyleSheet } from "react-native";
import { TokenTile } from "./TokenTile";
import { BlockCellTile } from "./BlockCellTile";
import type { GuessRow, TileState, NestedFeedback } from "@mathdle/core";
import { getTokenDisplay } from "@mathdle/core";

interface AttemptRowProps {
  row: GuessRow;
  answerLength: number;
  tileSize: number;
  isActive?: boolean;
  isInvalid?: boolean;
  focusedPath?: (string | number)[] | null;
  setFocusedPath?: (path: (string | number)[] | null) => void;
}

function feedbackToState(fb: NestedFeedback | undefined): TileState {
  if (!fb) return "absent";
  return fb.color === "correct" ? "correct" : fb.color === "present" ? "present" : "absent";
}

export function AttemptRow({
  row,
  answerLength,
  tileSize,
  isActive = false,
  isInvalid = false,
  focusedPath = null,
  setFocusedPath,
}: AttemptRowProps) {
  const tiles = Array.from({ length: answerLength }, (_, i) => {
    const currentPath = [i];

    // ── Submitted row ──────────────────────────────────────────────────────────
    if (row.status === "submitted") {
      const cell = row.cells[i];
      const feedbackObj = row.feedback[i];
      const state = feedbackToState(feedbackObj);

      if (!cell) return <TokenTile key={i} display="" state="empty" size={tileSize} />;

      if (cell.type === "block") {
        return (
          <BlockCellTile
            key={i}
            cell={cell}
            state={state}
            tileSize={tileSize}
            nestedFeedback={feedbackObj}
            pathPrefix={currentPath}
          />
        );
      }

      return (
        <TokenTile
          key={i}
          display={getTokenDisplay(cell.value)}
          state={state}
          size={tileSize}
        />
      );
    }

    // ── Active input row ───────────────────────────────────────────────────────
    if (isActive) {
      const cell = row.cells[i];
      const isFocused =
        focusedPath !== null &&
        JSON.stringify(focusedPath) === JSON.stringify(currentPath);
      const baseState: TileState = isInvalid ? "invalid" : cell ? "active" : "empty";
      const state: TileState =
        isFocused || (!focusedPath && i === row.cells.length) ? "pending" : baseState;

      if (!cell) {
        return (
          <TouchableOpacity key={i} onPress={() => setFocusedPath?.(null)} activeOpacity={0.7}>
            <TokenTile display="" state={state} size={tileSize} />
          </TouchableOpacity>
        );
      }

      if (cell.type === "block") {
        return (
          <BlockCellTile
            key={i}
            cell={cell}
            state={state}
            tileSize={tileSize}
            pathPrefix={currentPath}
            focusedPath={focusedPath}
            setFocusedPath={setFocusedPath}
          />
        );
      }

      return (
        <TouchableOpacity key={i} onPress={() => setFocusedPath?.(null)} activeOpacity={0.7}>
          <TokenTile display={getTokenDisplay(cell.value)} state={state} size={tileSize} />
        </TouchableOpacity>
      );
    }

    // ── Empty future row ───────────────────────────────────────────────────────
    return <TokenTile key={i} display="" state="empty" size={tileSize} />;
  });

  return <View style={styles.row}>{tiles}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginVertical: 2,
  },
});
