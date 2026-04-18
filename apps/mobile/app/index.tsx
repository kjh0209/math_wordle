/**
 * apps/mobile — Home screen
 * Brand landing with navigation to Play and Leaderboard.
 */

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Brand header */}
        <View style={styles.hero}>
          <Text style={styles.logo}>🧮</Text>
          <Text style={styles.brand}>Mathdle</Text>
          <Text style={styles.tagline}>수학 방정식 워들</Text>
          <Text style={styles.desc}>
            매일 새로운 수식을 6번의 시도 안에 맞혀보세요.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/play")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnIcon}>▶</Text>
            <Text style={styles.primaryBtnText}>오늘의 퍼즐 풀기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/leaderboard")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnIcon}>🏆</Text>
            <Text style={styles.secondaryBtnText}>리더보드</Text>
          </TouchableOpacity>
        </View>

        {/* How to play */}
        <View style={styles.howTo}>
          <Text style={styles.howToTitle}>게임 방법</Text>
          <View style={styles.steps}>
            <StepItem icon="🔢" text="수학 토큰을 조합하여 등식을 완성하세요." />
            <StepItem icon="🟩" text="정확한 위치의 토큰은 초록색으로 표시됩니다." />
            <StepItem icon="🟨" text="다른 위치에 있는 토큰은 노란색으로 표시됩니다." />
            <StepItem icon="⬛" text="등식에 없는 토큰은 회색으로 표시됩니다." />
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>ver 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

function StepItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepIcon}>{icon}</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gameBg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    gap: 32,
  },
  hero: {
    alignItems: "center",
    gap: 6,
  },
  logo: {
    fontSize: 56,
    marginBottom: 4,
  },
  brand: {
    fontSize: 36,
    fontWeight: "900",
    color: Colors.gameText,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.brand,
  },
  desc: {
    fontSize: 13,
    color: Colors.gameTextMuted,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.brand,
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryBtnIcon: {
    fontSize: 16,
    color: "#fff",
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.gameCard,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
  },
  secondaryBtnIcon: {
    fontSize: 16,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gameText,
  },
  howTo: {
    backgroundColor: Colors.gameCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.gameBorder,
    gap: 12,
  },
  howToTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.gameText,
    letterSpacing: 1,
  },
  steps: {
    gap: 10,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  stepText: {
    fontSize: 13,
    color: Colors.gameTextMuted,
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.gameMuted,
  },
});
