/**
 * packages/core/src/puzzles/mock-progression.ts
 *
 * Mock Stage/Step/Pool data for development without Supabase.
 * Each step gets exactly 5 distinct puzzle variants from the pool.
 */

import type { Stage, StageStep, StepPuzzlePoolEntry } from "../types/progression";
import { MOCK_PUZZLES } from "./mock-puzzles";

const ALL_IDS = MOCK_PUZZLES.map((p) => p.id);
// Cycle through all 10 mock puzzles: [p1..p10]

export const MOCK_STAGES: Stage[] = [
  {
    id: "stage-1",
    stageNumber: 1,
    title: "산수의 세계",
    theme: "arithmetic",
    description: "기초적인 사칙연산을 통해 논리력을 키워보세요.",
    isPublished: true,
  },
  {
    id: "stage-2",
    stageNumber: 2,
    title: "대수의 숲",
    theme: "algebra",
    description: "미지수 x와 함께하는 방정식의 모험.",
    isPublished: true,
  },
];

function makeSteps(stageId: string, stageNum: number): StageStep[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `step-${stageNum}-${i + 1}`,
    stageId,
    stepNumber: i + 1,
    code: `${stageNum}-${i + 1}`,
    title:
      i === 9
        ? `${stageNum === 1 ? "산수" : "대수"}의 제왕`
        : `${stageNum === 1 ? "수련" : "방정식"} ${i + 1}`,
    description:
      i === 9
        ? "마지막 관문입니다. 이 스테이지의 보스!"
        : `알맞은 수식을 완성하세요. (${i + 1}/10)`,
    difficulty: i < 3 ? "easy" : i < 7 ? "medium" : "hard",
    category: stageNum === 1 ? "arithmetic" : "algebra",
    isBoss: i === 9,
    unlockRule: null,
  }));
}

export const MOCK_STEPS: StageStep[] = [
  ...makeSteps("stage-1", 1),
  ...makeSteps("stage-2", 2),
];

// ── Deterministic pool: give each step 5 distinct puzzle IDs ─────────────────
// We have 10 puzzles and rotate them so each step's pool is a distinct window of 5.
export const MOCK_PUZZLE_POOL: StepPuzzlePoolEntry[] = [];

let entryId = 1;
MOCK_STEPS.forEach((step, stepIdx) => {
  // Rotate the puzzle list so each step starts from a different offset
  const offset = (stepIdx * 3) % ALL_IDS.length; // step by 3 to spread coverage
  const pool: string[] = [];
  for (let v = 0; v < 5; v++) {
    pool.push(ALL_IDS[(offset + v) % ALL_IDS.length]);
  }
  // Deduplicate (shouldn't happen with 10 puzzles / step=5, but be safe)
  const seen = new Set<string>();
  const unique = pool.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));

  unique.forEach((puzzleId, variantIdx) => {
    MOCK_PUZZLE_POOL.push({
      id: `pool-${entryId++}`,
      stageStepId: step.id,
      puzzleId,
      variantOrder: variantIdx + 1,
      weight: 1,
      isActive: true,
    });
  });
});

// ─── Query Helpers ────────────────────────────────────────────────────────────

export function getMockStages(): Stage[] {
  return MOCK_STAGES.filter((s) => s.isPublished).sort(
    (a, b) => a.stageNumber - b.stageNumber
  );
}

export function getMockStageById(id: string): Stage | null {
  return MOCK_STAGES.find((s) => s.id === id) ?? null;
}

export function getMockStepsForStage(stageId: string): StageStep[] {
  return MOCK_STEPS.filter((s) => s.stageId === stageId).sort(
    (a, b) => a.stepNumber - b.stepNumber
  );
}

export function getMockStepByCode(code: string): StageStep | null {
  return MOCK_STEPS.find((s) => s.code === code) ?? null;
}

export function getMockStepById(id: string): StageStep | null {
  return MOCK_STEPS.find((s) => s.id === id) ?? null;
}

export function getMockPoolForStep(stageStepId: string): StepPuzzlePoolEntry[] {
  return MOCK_PUZZLE_POOL.filter(
    (p) => p.stageStepId === stageStepId && p.isActive
  );
}
