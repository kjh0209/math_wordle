/**
 * apps/mobile — Share result landing screen
 * Shows a shared puzzle result and a "Try this puzzle" action.
 */

import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { AppHeader } from "../../components/ui/AppHeader";
import { ErrorState } from "../../components/ui/ErrorState";
import { Colors } from "../../constants/Colors";
import { fetchShare } from "@mathdle/core";

interface ShareData {
  puzzleTitle?: string;
  solved?: boolean;
  attemptsUsed?: number;
  maxAttempts?: number;
  emojiGrid?: string;
  clearTimeMs?: number | null;
}

export default function ShareScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ShareData | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchShare(code);
        if (cancelled) return;
        if (result.found) {
          setData(result.share as ShareData);
        } else {
          setError("공유 결과를 찾을 수 없습니다.");
        }
      } catch {
        if (!cancelled) setError("데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [code]);

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="공유 결과" />

      <View style={styles.container}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.brand} />
            <Text style={styles.loadingText}>공유 결과 불러오는 중...</Text>
          </View>
        )}

        {error && <ErrorState message={error} />}

        {data && !loading && (
          <View style={styles.card}>
            <Text style={styles.emoji}>
              {data.solved ? "🎉" : "😔"}
            </Text>

            <Text style={styles.title}>
              {data.puzzleTitle ?? "Mathdle"}
            </Text>

            <Text style={styles.score}>
              {data.solved
                ? `${data.attemptsUsed}/${data.maxAttempts}`
                : `X/${data.maxAttempts}`}
            </Text>

            {data.emojiGrid && (
              <Text style={styles.grid}>{data.emojiGrid}</Text>
            )}

            <TouchableOpacity
              style={styles.tryBtn}
              onPress={() => router.replace("/play")}
              activeOpacity={0.8}
            >
              <Text style={styles.tryBtnText}>🧮 이 퍼즐 풀어보기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.replace("/")}
              activeOpacity={0.8}
            >
              <Text style={styles.homeBtnText}>홈으로</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gameBg,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.gameTextMuted,
    fontSize: 14,
  },
  card: {
    backgroundColor: Colors.gameCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    padding: 28,
    alignItems: "center",
    gap: 14,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.gameText,
  },
  score: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.brand,
  },
  grid: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
  },
  tryBtn: {
    marginTop: 8,
    width: "100%",
    backgroundColor: Colors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  tryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  homeBtn: {
    paddingVertical: 10,
  },
  homeBtnText: {
    color: Colors.gameTextMuted,
    fontSize: 14,
  },
});
