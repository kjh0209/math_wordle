import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import type { KeyState } from "@mathdle/core";

interface KeypadButtonProps {
  display: string;
  state: KeyState;
  disabled?: boolean;
  width?: "normal" | "wide";
  variant?: "default" | "action" | "submit" | "danger";
  onPress: () => void;
}

const KEY_STATE_COLORS: Record<string, { bg: string; text: string }> = {
  unused:  { bg: Colors.keyDefault, text: Colors.gameText },
  correct: { bg: Colors.tileCorrect, text: "#fff" },
  present: { bg: Colors.tilePresent, text: "#fff" },
  absent:  { bg: Colors.tileAbsent, text: Colors.gameMuted },
};

const VARIANT_COLORS: Record<string, { bg: string; text: string }> = {
  action: { bg: Colors.keyAction, text: Colors.gameText },
  submit: { bg: Colors.brand, text: "#fff" },
  danger: { bg: Colors.keyAction, text: Colors.error },
};

export function KeypadButton({
  display,
  state,
  disabled = false,
  width = "normal",
  variant = "default",
  onPress,
}: KeypadButtonProps) {
  const colors =
    variant !== "default"
      ? VARIANT_COLORS[variant] ?? VARIANT_COLORS.action
      : KEY_STATE_COLORS[state] ?? KEY_STATE_COLORS.unused;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: colors.bg },
        width === "wide" && styles.wide,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <Text style={[styles.text, { color: colors.text }]}>{display}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    minWidth: 36,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    margin: 3,
  },
  wide: {
    minWidth: 56,
    paddingHorizontal: 14,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.4,
  },
});
