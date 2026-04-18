import { View, Text, ScrollView, StyleSheet } from "react-native";
import { KeypadButton } from "./KeypadButton";
import { Colors } from "../../constants/Colors";
import type { PuzzleViewModel, KeypadGroup, KeypadToken } from "@mathdle/core";
import type { KeyboardState } from "@mathdle/core";

interface ScientificKeypadProps {
  groups: KeypadGroup[];
  keyboardState: KeyboardState;
  disabled?: boolean;
  onToken: (token: KeypadToken) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit: () => void;
}

export function ScientificKeypad({
  groups,
  keyboardState,
  disabled = false,
  onToken,
  onDelete,
  onClear,
  onSubmit,
}: ScientificKeypadProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.keys}>
              {group.tokens.map((token) => (
                <KeypadButton
                  key={token.value}
                  display={token.display}
                  state={keyboardState[token.value] ?? "unused"}
                  disabled={disabled || token.disabled}
                  width={token.width}
                  onPress={() => onToken(token)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Action row */}
      <View style={styles.actionRow}>
        <KeypadButton
          display="전체삭제"
          state="unused"
          variant="danger"
          width="wide"
          disabled={disabled}
          onPress={onClear}
        />
        <KeypadButton
          display="삭제"
          state="unused"
          variant="action"
          width="wide"
          disabled={disabled}
          onPress={onDelete}
        />
        <KeypadButton
          display="제출"
          state="unused"
          variant="submit"
          width="wide"
          disabled={disabled}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    gap: 4,
  },
  scroll: {
    gap: 8,
    paddingBottom: 4,
  },
  group: {
    gap: 4,
  },
  groupLabel: {
    fontSize: 10,
    color: Colors.gameMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingLeft: 6,
  },
  keys: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.gameBorder,
    marginTop: 4,
  },
});
