import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import type { PuzzleCell } from "@mathdle/core";
import { getTokenDisplay, getBlockDisplay } from "@mathdle/core";

interface InputPreviewBarProps {
  cells: PuzzleCell[];
  maxLength: number;
  onDelete: () => void;
}

function cellDisplay(cell: PuzzleCell): string {
  if (cell.type === "token") return getTokenDisplay(cell.value);
  return getBlockDisplay(cell.blockType, cell.fields);
}

export function InputPreviewBar({ cells, maxLength, onDelete }: InputPreviewBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {cells.map((cell, i) => (
          <View key={i} style={styles.tokenChip}>
            <Text style={styles.tokenText}>{cellDisplay(cell)}</Text>
          </View>
        ))}
        {cells.length < maxLength && (
          <View style={styles.cursor}>
            <Text style={styles.cursorText}>▎</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.meta}>
        <Text style={styles.count}>
          {cells.length}/{maxLength}
        </Text>
        {cells.length > 0 && (
          <TouchableOpacity onPress={onDelete} style={styles.delBtn}>
            <Text style={styles.delText}>⌫</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gameCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    minHeight: 44,
  },
  scroll: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: 4,
  },
  tokenChip: {
    backgroundColor: Colors.tileActive,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tokenText: {
    color: Colors.gameText,
    fontSize: 16,
    fontWeight: "600",
  },
  cursor: {
    marginLeft: 2,
  },
  cursorText: {
    color: Colors.brand,
    fontSize: 18,
    fontWeight: "300",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  count: {
    fontSize: 12,
    color: Colors.gameMuted,
    fontWeight: "500",
  },
  delBtn: {
    padding: 4,
  },
  delText: {
    fontSize: 18,
    color: Colors.gameTextMuted,
  },
});
