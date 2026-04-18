/**
 * apps/mobile — Root layout
 * Configures API base URL, status bar, and stack navigation.
 */

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { configureApiBaseUrl } from "@mathdle/core";
import { Colors } from "../constants/Colors";

// Configure API base URL for the core API client
const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000";

configureApiBaseUrl(API_URL);

// Keep splash screen visible while we load
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.gameBg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="play" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="share/[code]" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gameBg,
  },
});
