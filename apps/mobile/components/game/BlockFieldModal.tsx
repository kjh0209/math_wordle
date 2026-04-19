/**
 * Modal to collect field values for parametric blocks.
 * Shown when user taps a block button that has fields (LogBase, SigmaRange, etc.)
 */

import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors } from "../../constants/Colors";
import type { KeypadToken } from "@mathdle/core";
import { getBlockDisplay } from "@mathdle/core";

// Korean labels for each field name
const FIELD_LABELS: Record<string, string> = {
  base: "밑 (base)",
  start: "시작값",
  end: "끝값",
  n: "n",
  r: "r",
};

// Placeholders hinting what kind of value to enter
const FIELD_PLACEHOLDERS: Record<string, string> = {
  base: "예) 2, 10, e",
  start: "예) 0, 1, k",
  end: "예) n, 10",
  n: "예) 5",
  r: "예) 2",
};

interface BlockFieldModalProps {
  token: KeypadToken | null;
  onConfirm: (blockType: string, fields: Record<string, string>) => void;
  onCancel: () => void;
}

export function BlockFieldModal({ token, onConfirm, onCancel }: BlockFieldModalProps) {
  const fieldNames = token?.blockFieldNames ?? [];
  const [values, setValues] = useState<Record<string, string>>({});

  if (!token) return null;

  const preview = getBlockDisplay(
    token.blockType as any,
    Object.fromEntries(fieldNames.map((f) => [f, values[f] || "?"]))
  );

  const allFilled = fieldNames.every((f) => (values[f] ?? "").trim() !== "");

  const handleConfirm = () => {
    if (!allFilled) return;
    onConfirm(token.blockType!, values);
    setValues({});
  };

  const handleCancel = () => {
    setValues({});
    onCancel();
  };

  return (
    <Modal visible={!!token} transparent animationType="fade" onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={modal.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={modal.backdropTouch} activeOpacity={1} onPress={handleCancel} />

        <View style={modal.sheet}>
          {/* Header */}
          <Text style={modal.title}>블록 값 입력</Text>
          <View style={modal.previewBox}>
            <Text style={modal.previewText}>{preview}</Text>
          </View>

          {/* Field inputs */}
          {fieldNames.map((field) => (
            <View key={field} style={modal.fieldRow}>
              <Text style={modal.fieldLabel}>{FIELD_LABELS[field] ?? field}</Text>
              <TextInput
                style={modal.input}
                placeholder={FIELD_PLACEHOLDERS[field] ?? "값 입력"}
                placeholderTextColor={Colors.gameMuted}
                value={values[field] ?? ""}
                onChangeText={(v) => setValues((prev) => ({ ...prev, [field]: v }))}
                autoCapitalize="none"
                keyboardType="default"
                selectTextOnFocus
              />
            </View>
          ))}

          {/* Buttons */}
          <View style={modal.btnRow}>
            <TouchableOpacity style={[modal.btn, modal.btnCancel]} onPress={handleCancel}>
              <Text style={modal.btnCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.btn, modal.btnConfirm, !allFilled && modal.btnDisabled]}
              onPress={handleConfirm}
              disabled={!allFilled}
            >
              <Text style={modal.btnConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.gameCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
    borderTopWidth: 1,
    borderColor: Colors.gameBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.gameText,
    textAlign: "center",
  },
  previewBox: {
    backgroundColor: Colors.gameBg,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.brand + "44",
  },
  previewText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.brand,
    fontFamily: "monospace",
  },
  fieldRow: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.gameTextMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.gameBg,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    color: Colors.gameText,
    fontWeight: "600",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: Colors.gameBorder,
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.gameTextMuted,
  },
  btnConfirm: {
    backgroundColor: Colors.brand,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnConfirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
