import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import type { TileState } from "@mathdle/core";

interface TokenTileProps {
  display: string;
  state: TileState;
  size: number;
}

const STATE_COLORS: Record<TileState, { bg: string; border: string }> = {
  empty:     { bg: Colors.tileEmpty,   border: Colors.gameBorder },
  active:    { bg: Colors.tileActive,  border: Colors.brand },
  correct:   { bg: Colors.tileCorrect, border: Colors.tileCorrect },
  present:   { bg: Colors.tilePresent, border: Colors.tilePresent },
  absent:    { bg: Colors.tileAbsent,  border: Colors.tileAbsent },
  invalid:   { bg: Colors.tileEmpty,   border: Colors.error },
  revealing: { bg: Colors.tileActive,  border: Colors.gameBorder },
  pending:   { bg: Colors.tileEmpty,   border: Colors.gameBorder },
};

export function TokenTile({ display, state, size }: TokenTileProps) {
  const colors = STATE_COLORS[state] ?? STATE_COLORS.empty;
  const fontSize = size > 40 ? 18 : size > 30 ? 15 : 12;

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize },
          state === "correct" || state === "present" || state === "absent"
            ? styles.submittedText
            : null,
        ]}
      >
        {display}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
  },
  text: {
    fontWeight: "700",
    color: Colors.gameText,
  },
  submittedText: {
    color: "#fff",
  },
});
