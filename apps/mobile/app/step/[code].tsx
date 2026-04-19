/**
 * apps/mobile — Step Intro
 * Shows step info and pool size before starting a game.
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { getStepByCode, PROBLEM_SETS } from "@mathdle/core";
import type { StageStep } from "@mathdle/core";

// PLAYER-Walk Cycle: 882×270, 3 frames of 294×270
// Display at height 56: scale = 56/270 = 0.207, frame_w = 294*0.207 ≈ 61, total_w = 882*0.207 ≈ 183
const WALK_FRAMES = 3;
const WALK_DISPLAY_H = 56;
const WALK_SCALE = WALK_DISPLAY_H / 270;
const WALK_FRAME_W = Math.round(294 * WALK_SCALE);   // ≈ 61
const WALK_TOTAL_W = Math.round(882 * WALK_SCALE);   // ≈ 183

export default function StepIntroScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [step, setStep] = useState<StageStep | null>(null);
  const [poolSize, setPoolSize] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);

  useEffect(() => {
    const s = getStepByCode(code);
    setStep(s);
    if (s) {
      const [stageNum, stepNum] = code.split("-").map(Number);
      setPoolSize((PROBLEM_SETS[`${stageNum}-${stepNum}`] ?? []).length);
    }
  }, [code]);

  // Walk cycle animation
  useEffect(() => {
    const id = setInterval(() => setWalkFrame(f => (f + 1) % WALK_FRAMES), 180);
    return () => clearInterval(id);
  }, []);

  if (!step) return null;

  const isBoss = step.isBoss;

  return (
    <ImageBackground
      source={require('../../assets/sprites/map-bg.png')}
      resizeMode="repeat"
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/' as never)} style={styles.backBtn}>
            <Image source={require('../../assets/sprites/mathle_logo.png')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/' as never)} style={styles.backArrow}>
            <Text style={styles.backArrowText}>← 맵으로</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* Boss banner */}
          {isBoss && (
            <View style={styles.bossBanner}>
              <Image source={require('../../assets/sprites/node-boss-active.png')} style={{ width: 52, height: 52, resizeMode: 'contain' }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bossTitle}>보스 스텝</Text>
                <Text style={styles.bossDesc}>이 스테이지의 마지막 관문입니다</Text>
              </View>
            </View>
          )}

          {/* Step card with walking character */}
          <View style={[styles.card, isBoss && styles.cardBoss]}>
            <View style={styles.nodeRow}>
              <Image
                source={isBoss
                  ? require('../../assets/sprites/node-boss-active.png')
                  : require('../../assets/sprites/node-normal-unlocked.png')}
                style={styles.nodeIcon}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.codeTag, isBoss && styles.codeTagBoss]}>{step.code}</Text>
                <Text style={styles.title}>{step.title}</Text>
                {step.difficulty && (
                  <Text style={styles.diff}>난이도: {diffLabel(step.difficulty)}</Text>
                )}
              </View>

              {/* Walking character — PLAYER-Walk Cycle.png */}
              <View style={{ overflow: 'hidden', width: WALK_FRAME_W, height: WALK_DISPLAY_H }}>
                <Image
                  source={require('../../assets/sprites/PLAYER-Walk Cycle.png')}
                  style={{ width: WALK_TOTAL_W, height: WALK_DISPLAY_H, marginLeft: -walkFrame * WALK_FRAME_W }}
                />
              </View>
            </View>
          </View>

          {/* Pool info */}
          <View style={styles.card}>
            <Text style={styles.poolTitle}>퍼즐 풀 : {poolSize}개</Text>
            <Text style={styles.poolDesc}>
              시작할 때마다 아직 풀지 않은 퍼즐이 우선 제공됩니다.
              다시 시도하면 다른 퍼즐이 출제될 수 있어요.
            </Text>
          </View>

          {/* Start button */}
          <TouchableOpacity
            style={[styles.startBtn, isBoss && styles.startBtnBoss]}
            onPress={() => router.push(`/step/${code}/play` as never)}
            activeOpacity={0.8}
          >
            <Text style={[styles.startBtnText, isBoss && styles.startBtnTextBoss]}>
              ▶  시작하기
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backCardBtn} onPress={() => router.replace('/' as never)} activeOpacity={0.7}>
            <Text style={styles.backCardText}>← 맵으로 돌아가기</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function diffLabel(d: string) {
  return d === "easy" ? "쉬움" : d === "medium" ? "보통" : "어려움";
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1e2d4a',
    backgroundColor: 'rgba(8,14,28,0.85)',
  },
  backBtn: {},
  logo: { width: 120, height: 32 },
  backArrow: { padding: 4 },
  backArrowText: { fontSize: 13, color: '#eab308', fontFamily: 'DungGeunMo', fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60, gap: 14 },

  bossBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(69,26,3,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    borderRadius: 12,
    padding: 14,
  },
  bossTitle: { fontSize: 15, fontWeight: '700', color: '#FCD34D', fontFamily: 'DungGeunMo' },
  bossDesc: { fontSize: 12, color: 'rgba(245,158,11,0.7)', marginTop: 2 },

  card: {
    backgroundColor: 'rgba(19,31,53,0.9)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e2d4a',
    padding: 16,
    gap: 8,
  },
  cardBoss: { borderColor: 'rgba(245,158,11,0.5)' },

  nodeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nodeIcon: { width: 56, height: 56 },

  codeTag: {
    fontSize: 11,
    fontFamily: 'DungGeunMo',
    fontWeight: '700',
    color: '#eab308',
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeTagBoss: { color: '#FCD34D' },
  title: { fontSize: 20, fontWeight: '800', color: Colors.gameText, fontFamily: 'DungGeunMo' },
  diff: { fontSize: 12, color: Colors.gameMuted, marginTop: 2 },

  poolTitle: { fontSize: 14, fontWeight: '700', color: Colors.gameText, fontFamily: 'DungGeunMo' },
  poolDesc: { fontSize: 13, color: Colors.gameTextMuted, lineHeight: 20 },

  startBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#16a34a',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  startBtnBoss: {
    backgroundColor: '#eab308',
    borderColor: '#ca8a04',
  },
  startBtnText: { fontSize: 16, fontWeight: '900', color: '#052e16', fontFamily: 'DungGeunMo', letterSpacing: 2 },
  startBtnTextBoss: { color: '#1c1917' },

  backCardBtn: {
    borderWidth: 1,
    borderColor: '#1e2d4a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backCardText: { fontSize: 13, color: Colors.gameMuted, fontFamily: 'DungGeunMo' },
});
