/**
 * apps/mobile — Stage Map (Home)
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  ImageBackground,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Defs, Pattern, Image as SvgImage } from "react-native-svg";
import { getAllStages, getStepsForStage } from "@mathdle/core";
import type { Stage, StageStep } from "@mathdle/core";
import { BottomNav } from "../components/BottomNav";
import { getClearedSteps, isStageUnlocked } from "../utils/progress";
import { getAdminMode, setAdminMode } from "../utils/adminMode";

const SVG_W = 300;
const NODE_HALF = 32;
const BOSS_HALF = 40;
const STEP_SPACING = 104;
const C = { active: { path: "#facc15" } } as const;

// player-idle: 2000×500 → 4 frames of 500×500, display 48×48 (scale 0.096)
const IDLE_FRAME_W = 48;
const IDLE_TOTAL_W = 192; // 2000 * 0.096

// NODE-ANIMATIONS: 1164×185 → 6 frames of 194×185
const NODE_FX_FRAMES = 6;
const NODE_FX_DISPLAY_H = 64;                              // keep within node bounds
const NODE_FX_SCALE = NODE_FX_DISPLAY_H / 185;
const NODE_FX_FRAME_W = Math.round(194 * NODE_FX_SCALE);  // ≈ 67
const NODE_FX_TOTAL_W = Math.round(1164 * NODE_FX_SCALE); // ≈ 402

// Mathdle_FX_Boss_Sheet: 1007×181 → 5 frames of ~201×181
const BOSS_FX_FRAMES = 5;
const BOSS_FX_DISPLAY_H = 80;
const BOSS_FX_SCALE = BOSS_FX_DISPLAY_H / 181;
const BOSS_FX_FRAME_W = Math.round((1007 / BOSS_FX_FRAMES) * BOSS_FX_SCALE); // ≈ 89
const BOSS_FX_TOTAL_W = Math.round(1007 * BOSS_FX_SCALE);                    // ≈ 445

// map-pointer: 164×130, display 26×21
const POINTER_W = 26;
const POINTER_H = Math.round(130 * (POINTER_W / 164)); // ≈ 21

function getMapHeight(stepsCount: number) {
  if (!stepsCount) return 300;
  return (stepsCount - 1) * STEP_SPACING + 160;
}

function nodeCoords(index: number, step: StageStep, totalHeight: number) {
  const y = totalHeight - 80 - index * STEP_SPACING;
  const x = 150 + Math.sin(index * 1.5) * 60;
  if (step.isBoss) return { x: 150, y };
  return { x, y };
}

function pathD(steps: StageStep[], totalHeight: number, maxCount?: number): string {
  const vis = maxCount !== undefined ? steps.slice(0, maxCount) : steps;
  if (vis.length < 2) return "";
  return vis.map((s, i) => {
    const p = nodeCoords(i, s, totalHeight);
    return i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`;
  }).join(" ");
}

interface StageNode {
  stage: Stage;
  steps: StageStep[];
  progress: { clearedSteps: number; unlocked: boolean } | null;
}

// ── WorldMap ────────────────────────────────────────────────────────────────

function WorldMap({ steps, currentStepIndex }: { steps: StageStep[]; currentStepIndex: number }) {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const containerHeight = getMapHeight(steps.length);

  // Sprite animations
  const [idleFrame, setIdleFrame]   = useState(0);
  const [nodeFrame, setNodeFrame]   = useState(0);
  const [bossFrame, setBossFrame]   = useState(0);

  // Boss warning modal
  const [pendingBoss, setPendingBoss] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setIdleFrame(f => (f + 1) % 4), 250);
    return () => clearInterval(id);
  }, []);

  // NODE-ANIMATIONS: play once through all frames, then stop
  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      if (frame >= NODE_FX_FRAMES) { clearInterval(id); return; }
      setNodeFrame(frame);
    }, 120);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pendingBoss) return;
    const id = setInterval(() => setBossFrame(f => (f + 1) % BOSS_FX_FRAMES), 120);
    return () => clearInterval(id);
  }, [pendingBoss]);

  const DECOS = [
    { source: require('../assets/sprites/deco-plus.png'),   x: 4,   y: containerHeight - 200,                size: 70 },
    { source: require('../assets/sprites/deco-times.png'),  x: 180, y: containerHeight - 400,                size: 60 },
    { source: require('../assets/sprites/deco-divide.png'), x: 0,   y: Math.max(0, containerHeight - 650),   size: 55 },
    { source: require('../assets/sprites/deco-figure.png'), x: 170, y: Math.max(80, containerHeight - 850),  size: 65 },
  ];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  const handleNodePress = useCallback((step: StageStep, isCleared: boolean, isCurrent: boolean) => {
    if (!isCleared && !isCurrent) return;
    if (step.isBoss && !isCleared) {
      setPendingBoss(step.code);
    } else {
      router.push(`/step/${step.code}` as never);
    }
  }, [router]);

  return (
    <View style={{ width: SVG_W, height: containerHeight }}>
      {/* Math watermark */}
      <Image
        source={require('../assets/sprites/NUM-SYM-SET.png')}
        style={{ position: 'absolute', top: 10, left: 10, width: 280, height: Math.min(400, containerHeight), opacity: 0.12, resizeMode: 'cover' }}
      />

      {/* Deco sprites */}
      {DECOS.map((d, i) =>
        d.y > -100 && d.y < containerHeight ? (
          <Image key={i} source={d.source} style={{ position: 'absolute', left: d.x, top: d.y, width: d.size, height: d.size, opacity: 0.82 }} />
        ) : null
      )}

      {/* SVG path — dim (path-tile-2) for future, bright (path-tile) for cleared */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="pp" width="12" height="12" patternUnits="userSpaceOnUse">
              <SvgImage href={require('../assets/sprites/path-tile.png')} width="12" height="12" />
            </Pattern>
            <Pattern id="pp2" width="12" height="12" patternUnits="userSpaceOnUse">
              <SvgImage href={require('../assets/sprites/path-tile-2.png')} width="12" height="12" />
            </Pattern>
          </Defs>
          {/* Full dim path */}
          <Path d={pathD(steps, containerHeight)} fill="none" stroke="url(#pp2)" strokeWidth={8} strokeLinecap="square" strokeDasharray="8 8" />
          {/* Cleared bright path */}
          {currentStepIndex > 0 && (
            <Path d={pathD(steps, containerHeight, currentStepIndex + 1)} fill="none" stroke="url(#pp)" strokeWidth={8} strokeLinecap="square" strokeDasharray="8 8" />
          )}
        </Svg>
      </View>

      {/* Nodes — directly positioned (no full-size wrapper Views to avoid zIndex bleed) */}
      {steps.map((step, i) => {
        const { x, y } = nodeCoords(i, step, containerHeight);
        const isCleared = currentStepIndex > i;
        const isCurrent = currentStepIndex === i;
        const half = step.isBoss ? BOSS_HALF : NODE_HALF;
        const nodeZ = isCurrent ? 3 : isCleared ? 2 : 1;

        let source;
        if (step.isBoss) {
          source = isCleared ? require('../assets/sprites/node-boss-cleared.png')
                 : isCurrent ? require('../assets/sprites/node-boss-active.png')
                 :             require('../assets/sprites/node-boss-locked.png');
        } else {
          source = isCleared ? require('../assets/sprites/node-normal-cleared.png')
                 : isCurrent ? require('../assets/sprites/node-normal-unlocked.png')
                 :             require('../assets/sprites/node-normal-locked.png');
        }

        return (
          <React.Fragment key={step.id}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleNodePress(step, isCleared, isCurrent)}
              style={{ position: 'absolute', left: x - half, top: y - half, width: half * 2, height: half * 2, zIndex: nodeZ }}
            >
              <Image source={source} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
            </TouchableOpacity>

            {!step.isBoss && (
              <Text
                style={{ position: 'absolute', left: x - 50, top: y + half + 4, width: 100, textAlign: 'center', color: '#fff', fontSize: 13, fontFamily: 'DungGeunMo', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1, zIndex: nodeZ }}
                pointerEvents="none"
              >
                {step.code}
              </Text>
            )}
            {step.isBoss && (
              <View style={{ position: 'absolute', left: x - 100, top: y + half + 4, width: 200, alignItems: 'center', zIndex: nodeZ }} pointerEvents="none">
                <Text style={{ color: '#eab308', fontSize: 18, fontFamily: 'DungGeunMo', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }}>BOSS</Text>
              </View>
            )}
          </React.Fragment>
        );
      })}

      {/* Current-step overlay — directly positioned, always on top (zIndex 10) */}
      {currentStepIndex >= 0 && currentStepIndex < steps.length && (() => {
        const step = steps[currentStepIndex];
        const { x, y } = nodeCoords(currentStepIndex, step, containerHeight);
        const half = step.isBoss ? BOSS_HALF : NODE_HALF;
        return (
          <React.Fragment key="current-overlay">
            {/* NODE-ANIMATIONS glow */}
            <View
              style={{ position: 'absolute', left: x - NODE_FX_FRAME_W / 2, top: y - NODE_FX_DISPLAY_H / 2, width: NODE_FX_FRAME_W, height: NODE_FX_DISPLAY_H, overflow: 'hidden', opacity: 0.85, zIndex: 10 }}
              pointerEvents="none"
            >
              <Image
                source={require('../assets/sprites/NODE-ANIMATIONS.png')}
                style={{ width: NODE_FX_TOTAL_W, height: NODE_FX_DISPLAY_H, marginLeft: -nodeFrame * NODE_FX_FRAME_W }}
              />
            </View>

            {/* Accent stars */}
            <Image source={require('../assets/sprites/result-star.png')} style={{ position: 'absolute', left: x - half - 15, top: y - half - 5,  width: 16, height: 16, opacity: 0.8, zIndex: 10 }} />
            <Image source={require('../assets/sprites/result-star.png')} style={{ position: 'absolute', left: x + half + 5,  top: y - half + 10, width: 12, height: 12, opacity: 0.6, zIndex: 10 }} />

            {/* Player + map-pointer */}
            <Animated.View
              style={{ position: 'absolute', left: x - 24, top: y - half - 56, transform: [{ translateY: floatAnim }], zIndex: 10 }}
              pointerEvents="none"
            >
              <View style={{ width: IDLE_FRAME_W, height: IDLE_FRAME_W, overflow: 'hidden' }}>
                <Image
                  source={require('../assets/sprites/player-idle.png')}
                  style={{ width: IDLE_TOTAL_W, height: IDLE_FRAME_W, marginLeft: -idleFrame * IDLE_FRAME_W }}
                />
              </View>
              <Image
                source={require('../assets/sprites/map-pointer.png')}
                style={{ width: POINTER_W, height: POINTER_H, alignSelf: 'center', marginTop: 2 }}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Dialogue bubble */}
            <View
              style={{ position: 'absolute', left: x - 70, top: y - half - 116, width: 140, height: 54, zIndex: 10 }}
              pointerEvents="none"
            >
              <ImageBackground
                source={require('../assets/sprites/dialogue-bubble.png')}
                resizeMode="stretch"
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 10 }}
              >
                <Text style={{ color: '#0a1122', fontSize: 8, fontFamily: 'DungGeunMo', textAlign: 'center', paddingHorizontal: 10 }} numberOfLines={2}>
                  {step.title}
                </Text>
              </ImageBackground>
            </View>
          </React.Fragment>
        );
      })()}

      {/* Boss Warning Modal */}
      <Modal visible={!!pendingBoss} transparent animationType="fade">
        <View style={bossModal.backdrop}>
          <View style={bossModal.sheet}>
            {/* Mathdle_FX_Boss_Sheet animated FX */}
            <View style={{ overflow: 'hidden', width: BOSS_FX_FRAME_W, height: BOSS_FX_DISPLAY_H, marginBottom: 4 }}>
              <Image
                source={require('../assets/sprites/Mathdle_FX_Boss_Sheet.png')}
                style={{ width: BOSS_FX_TOTAL_W, height: BOSS_FX_DISPLAY_H, marginLeft: -bossFrame * BOSS_FX_FRAME_W }}
              />
            </View>

            {/* boss-warning.png banner */}
            <Image
              source={require('../assets/sprites/boss-warning.png')}
              style={{ width: 280, height: Math.round(147 * (280 / 426)) }}
              resizeMode="contain"
            />

            <Text style={bossModal.title}>BOSS BATTLE!</Text>
            <Text style={bossModal.sub}>{"이 스테이지의 마지막 관문\n준비되셨나요?"}</Text>

            <TouchableOpacity
              style={bossModal.confirmBtn}
              onPress={() => {
                const code = pendingBoss;
                setPendingBoss(null);
                if (code) router.push(`/step/${code}` as never);
              }}
              activeOpacity={0.8}
            >
              <Text style={bossModal.confirmText}>도전하기!</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={bossModal.cancelBtn}
              onPress={() => setPendingBoss(null)}
              activeOpacity={0.7}
            >
              <Text style={bossModal.cancelText}>← 돌아가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── StageMapScreen ──────────────────────────────────────────────────────────

export default function StageMapScreen() {
  const [stages, setStages] = useState<StageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = useCallback(async () => {
    const [cleared, admin] = await Promise.all([getClearedSteps(), getAdminMode()]);
    setIsAdmin(admin);
    const mapped = getAllStages().map((stage) => {
      const steps = getStepsForStage(stage.stageNumber);
      const clearedCount = steps.filter((s) => cleared.has(s.code)).length;
      return {
        stage,
        steps,
        progress: { clearedSteps: clearedCount, unlocked: admin || isStageUnlocked(stage.stageNumber, cleared) },
      };
    });
    setStages(mapped);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const switchMode = async (admin: boolean) => {
    await setAdminMode(admin);
    setIsAdmin(admin);
    loadData();
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../assets/sprites/map-bg.png')} resizeMode="repeat" style={styles.bg}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

          {/* Fixed top bar */}
          <View style={styles.topBar}>
            <Image source={require('../assets/sprites/mathle_logo.png')} style={styles.logo} resizeMode="contain" />
            <TouchableOpacity
              onPress={() => switchMode(!isAdmin)}
              style={[styles.adminPill, isAdmin && styles.adminPillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.adminPillText, isAdmin && styles.adminPillTextActive]}>
                {isAdmin ? '🔑 관리자' : '일반 모드'}
              </Text>
            </TouchableOpacity>
          </View>

          {isAdmin && (
            <View style={styles.adminBanner}>
              <Text style={styles.adminBannerText}>관리자 모드 — 모든 스테이지 개방됨</Text>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <Text style={styles.loadingText}>불러오는 중...</Text>
            ) : (
              <View style={{ flexDirection: 'column-reverse', alignItems: 'center', paddingBottom: 80, width: '100%' }}>
                {stages.map((node, idx) => {
                  const isUnlocked = node.progress?.unlocked ?? idx === 0;
                  const clearedSteps = node.progress?.clearedSteps ?? 0;
                  // Admin mode: set index past all steps so all are isCleared=true
                  const currentStepIndex = !isUnlocked ? -1 : isAdmin ? node.steps.length : clearedSteps;
                  return (
                    <View key={node.stage.id} style={{ width: '100%', alignItems: 'center', marginTop: 40 }}>
                      <View style={styles.worldLabelWrap}>
                        <Text style={[styles.worldLabel, !isUnlocked && styles.worldLabelLocked]}>
                          WORLD {node.stage.stageNumber}: {node.stage.title?.toUpperCase()}
                        </Text>
                      </View>
                      <WorldMap steps={node.steps ?? []} currentStepIndex={currentStepIndex} />
                      {idx > 0 && (
                        <View style={{ marginTop: 10, marginBottom: -40, opacity: 0.5 }}>
                          {[...Array(14)].map((_, i) => (
                            <View key={i} style={{ width: 6, height: 6, backgroundColor: '#1e2d4a', marginBottom: 6 }} />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1729' },
  bg: { flex: 1, width: '100%', height: '100%' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1e2d4a',
    backgroundColor: 'rgba(8,14,28,0.85)',
  },
  logo: { width: 140, height: 36 },
  adminPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e2d4a',
    backgroundColor: 'rgba(30,45,74,0.5)',
  },
  adminPillActive: { borderColor: '#eab308', backgroundColor: 'rgba(234,179,8,0.15)' },
  adminPillText: { fontSize: 11, fontWeight: '700', color: '#4a5a7a', fontFamily: 'DungGeunMo' },
  adminPillTextActive: { color: '#eab308' },

  adminBanner: {
    backgroundColor: 'rgba(234,179,8,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234,179,8,0.2)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  adminBannerText: { fontSize: 11, color: '#eab308', fontFamily: 'DungGeunMo' },

  scrollContent: { paddingTop: 8, alignItems: 'center' },
  loadingText: { textAlign: 'center', marginTop: 40, color: '#4a5a7a', fontFamily: 'DungGeunMo' },

  worldLabelWrap: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(15,23,41,0.5)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1e2d4a',
  },
  worldLabel: {
    color: '#eab308',
    fontSize: 13,
    fontFamily: 'DungGeunMo',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  worldLabelLocked: { color: '#2d3a52' },
});

const bossModal = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#0f1729',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(245,158,11,0.5)',
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FCD34D',
    fontFamily: 'DungGeunMo',
    letterSpacing: 3,
    textShadowColor: 'rgba(245,158,11,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  sub: {
    fontSize: 13,
    color: 'rgba(245,158,11,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#eab308',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: '#ca8a04',
    marginTop: 4,
  },
  confirmText: { fontSize: 16, fontWeight: '900', color: '#1c1917', fontFamily: 'DungGeunMo', letterSpacing: 2 },
  cancelBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e2d4a',
  },
  cancelText: { fontSize: 13, color: '#4a5a7a', fontFamily: 'DungGeunMo' },
});
