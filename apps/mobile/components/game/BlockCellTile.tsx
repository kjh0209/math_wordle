import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getTokenDisplay } from "@mathdle/core";
import { Colors } from "../../constants/Colors";
import type { BlockCell, PuzzleCell, TileState, NestedFeedback } from "@mathdle/core";

const TILE_COLORS: Record<TileState, { bg: string; border: string; text: string }> = {
  empty:     { bg: Colors.tileEmpty,   border: Colors.gameBorder,  text: Colors.gameText },
  active:    { bg: Colors.tileActive,  border: Colors.brand,       text: Colors.gameText },
  correct:   { bg: Colors.tileCorrect, border: Colors.tileCorrect, text: "#fff" },
  present:   { bg: Colors.tilePresent, border: Colors.tilePresent, text: "#fff" },
  absent:    { bg: Colors.tileAbsent,  border: Colors.tileAbsent,  text: "#fff" },
  invalid:   { bg: Colors.tileEmpty,   border: Colors.error,       text: Colors.gameText },
  revealing: { bg: Colors.tileActive,  border: Colors.gameBorder,  text: Colors.gameText },
  pending:   { bg: Colors.tileEmpty,   border: Colors.gameBorder,  text: Colors.gameText },
};

interface SmallSlotProps {
  cell?: PuzzleCell;
  feedback?: string;
  isFocused: boolean;
  onPress: () => void;
}

function SmallSlot({ cell, feedback, isFocused, onPress }: SmallSlotProps) {
  let bg = isFocused ? Colors.brand + "88" : cell ? Colors.tileActive : Colors.gameSurface;
  let textColor = Colors.gameText;
  let borderColor = isFocused ? Colors.brand : Colors.gameBorder;

  if (feedback === "correct") { bg = Colors.tileCorrect; textColor = "#fff"; borderColor = Colors.tileCorrect; }
  else if (feedback === "present") { bg = Colors.tilePresent; textColor = "#fff"; borderColor = Colors.tilePresent; }
  else if (feedback === "absent") { bg = Colors.tileAbsent; textColor = "#fff"; borderColor = Colors.tileAbsent; }

  const val =
    cell?.type === "token" ? getTokenDisplay(cell.value) :
    cell?.type === "block" ? cell.blockType : "";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.slot, { backgroundColor: bg, borderColor }]}
    >
      <Text style={[styles.slotText, { color: textColor }]}>{val || "\u00A0"}</Text>
    </TouchableOpacity>
  );
}

interface BlockCellTileProps {
  cell: BlockCell;
  state: TileState;
  tileSize?: number;
  nestedFeedback?: NestedFeedback;
  pathPrefix?: (string | number)[];
  focusedPath?: (string | number)[] | null;
  setFocusedPath?: (path: (string | number)[] | null) => void;
}

export function BlockCellTile({
  cell,
  state,
  tileSize = 44,
  nestedFeedback,
  pathPrefix = [],
  focusedPath = null,
  setFocusedPath,
}: BlockCellTileProps) {
  const tileColors = TILE_COLORS[state] ?? TILE_COLORS.empty;

  const renderField = (fieldName: string) => {
    const fieldCells = cell.cellFields?.[fieldName] || [];
    const fieldsFeedback = nestedFeedback?.fields?.[fieldName] || [];
    const fieldPath = [...pathPrefix, fieldName];
    const isFieldFocused =
      focusedPath !== null &&
      JSON.stringify(focusedPath) === JSON.stringify(fieldPath);

    const slots = fieldCells.map((fc, idx) => {
      const fb = fieldsFeedback[idx];
      const colorStr = typeof fb === "string" ? fb : fb?.color;
      return (
        <SmallSlot
          key={idx}
          cell={fc}
          feedback={colorStr}
          isFocused={false}
          onPress={() => setFocusedPath?.(fieldPath)}
        />
      );
    });

    if (setFocusedPath && (fieldCells.length === 0 || isFieldFocused)) {
      slots.push(
        <SmallSlot
          key="empty"
          isFocused={isFieldFocused}
          onPress={() => setFocusedPath?.(fieldPath)}
        />
      );
    }

    return (
      <View
        key={fieldName}
        style={[styles.fieldRow, isFieldFocused && styles.fieldFocused]}
      >
        {slots}
      </View>
    );
  };

  const renderContent = () => {
    switch (cell.blockType) {
      case "LogBase":
        return (
          <View style={styles.rowCenter}>
            <Text style={[styles.mono, { color: tileColors.text }]}>log</Text>
            <View style={styles.subscript}>{renderField("base")}</View>
            <Text style={[styles.mono, { color: tileColors.text }]}>( )</Text>
          </View>
        );
      case "SigmaRange":
        return (
          <View style={styles.colCenter}>
            <View style={styles.smallScale}>{renderField("end")}</View>
            <Text style={[styles.monoLg, { color: tileColors.text }]}>Σ</Text>
            <View style={styles.rowCenter}>
              <Text style={[styles.monoSm, { color: tileColors.text }]}>i=</Text>
              {renderField("start")}
            </View>
          </View>
        );
      case "IntegralRange":
        return (
          <View style={styles.colCenter}>
            <View style={styles.smallScale}>{renderField("end")}</View>
            <Text style={[styles.monoXl, { color: tileColors.text }]}>∫</Text>
            <View style={styles.smallScale}>{renderField("start")}</View>
          </View>
        );
      case "dx":
        return <Text style={[styles.mono, styles.italic, { color: tileColors.text }]}>dx</Text>;
      case "Comb":
        return (
          <View style={styles.rowCenter}>
            {renderField("n")}
            <Text style={[styles.mono, { color: tileColors.text }]}>C</Text>
            {renderField("r")}
          </View>
        );
      case "Perm":
        return (
          <View style={styles.rowCenter}>
            {renderField("n")}
            <Text style={[styles.mono, { color: tileColors.text }]}>P</Text>
            {renderField("r")}
          </View>
        );
      case "d/dx":
        return <Text style={[styles.mono, { color: tileColors.text }]}>d/dx</Text>;
      default:
        return <Text style={[styles.mono, { color: tileColors.text }]}>{cell.blockType}</Text>;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          minHeight: tileSize,
          backgroundColor: tileColors.bg,
          borderColor: tileColors.border,
        },
      ]}
    >
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    margin: 2,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  colCenter: {
    alignItems: "center",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fieldFocused: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.brand + "88",
    padding: 1,
  },
  slot: {
    minWidth: 16,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    margin: 1,
  },
  slotText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  mono: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  monoSm: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  monoLg: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  monoXl: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  italic: {
    fontStyle: "italic",
  },
  subscript: {
    marginTop: 6,
    marginRight: 1,
  },
  smallScale: {
    transform: [{ scale: 0.85 }],
  },
});
