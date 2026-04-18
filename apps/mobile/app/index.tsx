import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  ImageBackground,
  Image,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Defs, Pattern, Image as SvgImage } from "react-native-svg";
import { getMockStages, getMockStepsForStage } from "@mathdle/core";
import type { Stage, StageStep } from "@mathdle/core";
import { BottomNav } from "../components/BottomNav";

const SVG_W = 300;
const NODE_HALF = 32;
const BOSS_HALF = 40;
const STEP_SPACING = 80;

const C = { active: { path: "#facc15" } } as const;

function getMapHeight(stepsCount: number) {
  if (!stepsCount) return 300;
  // Make height exactly precise so items don't overlap into empty dead space
  // stepsCount = 10 -> 9 spaces of 80px = 720px. 
  // Add 80px top margin and 80px bottom margin.
  return (stepsCount - 1) * STEP_SPACING + 160;
}

function nodeCoords(index: number, step: StageStep, totalHeight: number): { x: number; y: number } {
  // index 0 -> y = totalHeight - 80 (Bottom)
  // index 9 -> y = totalHeight - 80 - 720 = 80 (Top)
  const y = totalHeight - 80 - (index * STEP_SPACING);

  // Smooth sinusoidal wave around center x=150
  const sine = Math.sin(index * 1.5);
  const x = 150 + sine * 60;

  if (step.isBoss) {
    return { x: 150, y };
  }
  return { x, y };
}

function pathD(steps: StageStep[], totalHeight: number, maxCount?: number): string {
  const visibleSteps = maxCount !== undefined ? steps.slice(0, maxCount) : steps;
  if (visibleSteps.length < 2) return "";
  let d = "";
  visibleSteps.forEach((step, i) => {
    const pt = nodeCoords(i, step, totalHeight);
    if (i === 0) d += `M ${pt.x} ${pt.y} `;
    else d += `L ${pt.x} ${pt.y} `;
  });
  return d;
}

interface StageNode {
  stage: Stage;
  steps: StageStep[];
  progress: { clearedSteps: number; unlocked: boolean } | null;
}

function WorldMap({ steps, currentStepIndex }: { steps: StageStep[]; currentStepIndex: number; }) {
  const router = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const containerHeight = getMapHeight(steps.length);

  const DECOS = [
    { source: require('../assets/sprites/deco-plus.png'), x: -10, y: containerHeight - 200, size: 140 },
    { source: require('../assets/sprites/deco-times.png'), x: 180, y: containerHeight - 400, size: 120 },
    { source: require('../assets/sprites/deco-divide.png'), x: 0, y: Math.max(0, containerHeight - 650), size: 110 },
    { source: require('../assets/sprites/deco-figure.png'), x: 170, y: Math.max(80, containerHeight - 850), size: 130 },
  ];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true })
      ])
    ).start();
  }, [floatAnim]);

  return (
    <View style={{ width: SVG_W, height: containerHeight }}>
      {/* 1. Underlying Background Layers using robust RN Image to avoid grey-box SVG transparency bugs */}
      <Image source={require('../assets/sprites/NUM-SYM-SET.png')} style={{ position: 'absolute', top: 10, left: 10, width: 280, height: Math.min(400, containerHeight), opacity: 0.15, resizeMode: 'cover' }} />
      
      {DECOS.map((deco, i) => (
        deco.y > -100 && deco.y < containerHeight && (
          <Image key={`deco-${i}`} source={deco.source} style={{ position: 'absolute', left: deco.x, top: deco.y, width: deco.size, height: deco.size, opacity: 0.8 }} />
        )
      ))}

      {/* 2. SVG Paths layer */}
      <View style={{ width: '100%', height: '100%', position: 'absolute' }} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="path-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
              <SvgImage href={require('../assets/sprites/path-tile.png')} width="12" height="12" />
            </Pattern>
          </Defs>

          <Path d={pathD(steps, containerHeight)} fill="none" stroke="url(#path-pattern)" strokeWidth={8} strokeLinecap="square" strokeDasharray="8 8" />

          {currentStepIndex >= 0 && (
            <Path d={pathD(steps, containerHeight, currentStepIndex + 1)} fill="none" stroke={C.active.path} strokeWidth={8} strokeLinecap="square" strokeDasharray="8 12" />
          )}
        </Svg>
      </View>

      {/* 3. Interactive Nodes layered on top of SVG layout as pure RN Elements */}
      {steps.map((step, i) => {
        const { x, y } = nodeCoords(i, step, containerHeight);
        const isCleared = currentStepIndex > i;
        const isCurrent = currentStepIndex === i;
        const half = step.isBoss ? BOSS_HALF : NODE_HALF;

        const spriteSrc = step.isBoss 
          ? (isCleared ? 'cleared' : isCurrent ? 'unlocked' : 'locked') 
          : (isCleared ? 'cleared' : isCurrent ? 'unlocked' : 'locked');
          
        let source;
        if (step.isBoss) {
          source = spriteSrc === 'cleared' ? require('../assets/sprites/node-boss-cleared.png') 
                 : spriteSrc === 'unlocked' ? require('../assets/sprites/node-boss-locked.png')
                 : require('../assets/sprites/node-boss-locked.png');
        } else {
          source = spriteSrc === 'cleared' ? require('../assets/sprites/node-normal-cleared.png')
                 : spriteSrc === 'unlocked' ? require('../assets/sprites/node-normal-unlocked.png')
                 : require('../assets/sprites/node-normal-locked.png');
        }

        return (
          <View key={`node-container-${step.id}`} style={{ position: 'absolute', left: 0, top: 0, width: SVG_W, height: containerHeight }} pointerEvents="box-none">
            
            {/* Sparkles under the node but overpath */}
            {isCurrent && (
              <>
                <Image source={require('../assets/sprites/result-star.png')} style={{ position: 'absolute', left: x - half - 15, top: y - half - 5, width: 16, height: 16, opacity: 0.8 }} />
                <Image source={require('../assets/sprites/result-star.png')} style={{ position: 'absolute', left: x + half + 5, top: y - half + 10, width: 12, height: 12, opacity: 0.6 }} />
              </>
            )}

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => { if(isCleared || isCurrent) router.push(`/stage/${step.id}` as never); }}
              style={{ position: 'absolute', left: x - half, top: y - half, width: half * 2, height: half * 2 }}
            >
              <Image source={source} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
            </TouchableOpacity>

            {/* Step Subtext */}
            {!step.isBoss && (
              <Text style={{
                position: 'absolute', left: x - 50, top: y + half + 4, width: 100, textAlign: 'center',
                color: '#ffffff', fontSize: 13, fontFamily: 'DungGeunMo',
                textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1
              }} pointerEvents="none">
                {step.code}
              </Text>
            )}

            {/* Boss Subtext */}
            {step.isBoss && (
              <View style={{ position: 'absolute', left: x - 100, top: y + half + 4, width: 200, alignItems: 'center' }} pointerEvents="none">
                <Text style={{
                  color: '#eab308', fontSize: 18, fontFamily: 'DungGeunMo',
                  textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1
                }}>
                  BOSS
                </Text>
              </View>
            )}

            {/* Player floating above everything. Masked correctly for Sprite sheet! */}
            {isCurrent && (
              <Animated.View style={{
                position: 'absolute', left: x - 24, top: y - half - 56,
                transform: [{ translateY: floatAnim }]
              }} pointerEvents="none">
                <View style={{ width: 48, height: 48, overflow: 'hidden' }}>
                    <Image source={require('../assets/sprites/player-idle.png')} style={{ width: 192, height: 48, resizeMode: 'stretch' }} />
                </View>
                <View style={[styles.playerArrowDown, { marginTop: -4 }]} />
              </Animated.View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function StageMapScreen() {
  const [stages, setStages] = useState<StageNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const allStages = getMockStages();
      const mapped = allStages.map((stage, idx) => ({
        stage,
        steps: getMockStepsForStage(stage.id),
        progress: idx === 0 ? { clearedSteps: 0, unlocked: true } : null
      }));
      setStages(mapped);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../assets/sprites/map-bg.png')} resizeMode="repeat" style={styles.bg}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <Text style={{ textAlign: 'center', marginTop: 40, color: '#4a5a7a' }}>불러오는 중...</Text>
            ) : (
              <View style={{ flexDirection: 'column-reverse', alignItems: 'center', paddingBottom: 100, width: '100%' }}>
                {stages.map((node, stageIdx) => {
                   const isUnlocked = stageIdx === 0 || !!node.progress?.unlocked;
                   // Default current step index to 0 or -1 based on unlock status
                   const currentStepIndex = isUnlocked ? 0 : -1;
                   return (
                     <View key={node.stage.id} style={{ width: '100%', alignItems: 'center', zIndex: 10, marginTop: 40 }}>
                        <View style={{ alignItems: 'center', marginBottom: 15, paddingHorizontal: 20, zIndex: 11 }}>
                          <Text style={styles.worldTitle}>WORLD {node.stage.stageNumber}: {node.stage.title}</Text>
                        </View>
                        
                        <WorldMap steps={node.steps ?? []} currentStepIndex={currentStepIndex} />
                        
                        {stageIdx > 0 && (
                          <View style={{ marginTop: 10, marginBottom: -40, zIndex: 0 }}>
                            <View style={{ opacity: 0.5 }}>
                                {/* Decorative line connecting between stages */}
                                {[...Array(14)].map((_, i) => (
                                    <View key={`connector-${i}`} style={{ width: 6, height: 6, backgroundColor: '#1e2d4a', marginBottom: 6 }} />
                                ))}
                            </View>
                          </View>
                        )}
                     </View>
                   );
                })}

                {/* Hero Top Logo! */}
                <View style={{ alignItems: 'center', marginTop: 50, marginBottom: 10, zIndex: 10 }}>
                  <Image source={require('../assets/sprites/logo.png')} style={{ width: 224, height: 60, resizeMode: 'contain' }} />
                </View>
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
  scrollContent: { paddingTop: 16, flexGrow: 1, alignItems: 'center' },
  worldTitle: { 
    color: '#ffffff', fontSize: 16, fontFamily: 'DungGeunMo', textTransform: 'uppercase', 
    letterSpacing: 2, textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0,
    backgroundColor: 'rgba(15, 23, 41, 0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4
  },
  playerArrowDown: {
    width: 0, height: 0, 
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, 
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1e2d4a', 
    alignSelf: 'center', marginTop: -2
  }
});
