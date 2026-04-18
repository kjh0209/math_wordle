import { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";
import type { ToastMessage } from "@mathdle/core";

interface ToastProps {
  toast: ToastMessage | null;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  error:   { bg: "rgba(127,29,29,0.92)", border: Colors.error,   text: "#fecaca" },
  success: { bg: "rgba(20,83,45,0.92)",  border: Colors.success, text: "#bbf7d0" },
  info:    { bg: Colors.gameCard,         border: Colors.gameBorder, text: Colors.gameText },
  warning: { bg: "rgba(113,63,18,0.92)",  border: Colors.warning, text: "#fef08a" },
};

export function Toast({ toast }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [toast]);

  if (!toast) return null;

  const s = TYPE_STYLES[toast.type] ?? TYPE_STYLES.info;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: s.bg, borderColor: s.border, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { color: s.text }]}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 32,
    right: 32,
    zIndex: 100,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
