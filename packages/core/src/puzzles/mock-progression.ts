/**
 * packages/core/src/puzzles/mock-progression.ts
 *
 * Provides mock Stage and Step data to simulate the database
 * until Supabase is fully integrated.
 */

import type { Stage, StageStep, StepPuzzlePoolEntry } from "../types/progression";
import { MOCK_PUZZLES } from "./mock-puzzles";

// Ensure we have some mocks
const puzzleIds = MOCK_PUZZLES.map(p => p.id);

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
  }
];

export const MOCK_STEPS: StageStep[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `step-1-${i + 1}`,
  stageId: "stage-1",
  stepNumber: i + 1,
  code: `1-${i + 1}`,
  title: i === 9 ? "산수의 제왕" : `수련 ${i + 1}`,
  description: i === 9 ? "마지막 관문입니다." : "알맞은 수식을 완성하세요.",
  difficulty: i < 3 ? "easy" : i < 7 ? "medium" : "hard",
  category: "arithmetic",
  isBoss: i === 9,
  unlockRule: null,
}));

// Stage 2 steps
MOCK_STEPS.push(...Array.from({ length: 10 }).map((_, i) => ({
  id: `step-2-${i + 1}`,
  stageId: "stage-2",
  stepNumber: i + 1,
  code: `2-${i + 1}`,
  title: i === 9 ? "대수의 제왕" : `방정식 ${i + 1}`,
  description: i === 9 ? "마지막 관문입니다." : "변수 x를 포함하여 수식을 완성하세요.",
  difficulty: "hard",
  category: "algebra",
  isBoss: i === 9,
  unlockRule: null,
})));

export const MOCK_PUZZLE_POOL: StepPuzzlePoolEntry[] = [];

// Map 5 pseudo-randomly selected puzzles to every step
let idCounter = 1;
for (const step of MOCK_STEPS) {
  for (let variant = 1; variant <= 5; variant++) {
    const randomPuzzleId = puzzleIds[Math.floor(Math.random() * puzzleIds.length)];
    MOCK_PUZZLE_POOL.push({
      id: `pool-entry-${idCounter++}`,
      stageStepId: step.id,
      puzzleId: randomPuzzleId,
      variantOrder: variant,
      weight: 1,
      isActive: true,
    });
  }
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

export function getMockStages(): Stage[] {
  return MOCK_STAGES.filter(s => s.isPublished).sort((a, b) => a.stageNumber - b.stageNumber);
}

export function getMockStageById(id: string): Stage | null {
  return MOCK_STAGES.find(s => s.id === id) ?? null;
}

export function getMockStepsForStage(stageId: string): StageStep[] {
  return MOCK_STEPS.filter(s => s.stageId === stageId).sort((a, b) => a.stepNumber - b.stepNumber);
}

export function getMockStepByCode(code: string): StageStep | null {
  return MOCK_STEPS.find(s => s.code === code) ?? null;
}

export function getMockStepById(id: string): StageStep | null {
  return MOCK_STEPS.find(s => s.id === id) ?? null;
}

export function getMockPoolForStep(stageStepId: string): StepPuzzlePoolEntry[] {
  return MOCK_PUZZLE_POOL.filter(p => p.stageStepId === stageStepId && p.isActive);
}
