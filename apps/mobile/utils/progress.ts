/**
 * apps/mobile — Step/Stage progress persistence
 * AsyncStorage key: mathdle:cleared_steps → string[] of cleared step codes
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "mathdle:cleared_steps";

export async function getClearedSteps(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(KEY);
  return new Set<string>(raw ? JSON.parse(raw) : []);
}

export async function markStepCleared(stepCode: string): Promise<void> {
  const cleared = await getClearedSteps();
  if (cleared.has(stepCode)) return;
  cleared.add(stepCode);
  await AsyncStorage.setItem(KEY, JSON.stringify([...cleared]));
}

export function isStageUnlocked(stageNum: number, cleared: Set<string>): boolean {
  if (stageNum === 1) return true;
  return cleared.has(`${stageNum - 1}-10`);
}

export function isStepUnlocked(
  stageNum: number,
  stepNum: number,
  cleared: Set<string>
): boolean {
  if (stepNum === 1) return true;
  return cleared.has(`${stageNum}-${stepNum - 1}`);
}
