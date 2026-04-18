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
// IMPORTANT: Do NOT use localhost/127.0.0.1 for physical mobile devices. Use your PC's LAN IP.
const API_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl;

if (API_URL) {
  configureApiBaseUrl(API_URL);
} else {
  // Mobile app MUST have an absolute URL. If not provided, warn the developer.
  console.warn(
    "⚠️ No API URL configured. Physical devices will fail to connect. " +
    "Please set EXPO_PUBLIC_API_BASE_URL to your PC's LAN IP (e.g. http://192.168.1.100:3000)."
  );
  // Just a fallback for simulators
  configureApiBaseUrl("http://10.0.2.2:3000"); 
}

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
        <Stack.Screen name="stage/[stageNum]" />
        <Stack.Screen name="step/[code]" />
        <Stack.Screen name="step/[code]/play" />
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
