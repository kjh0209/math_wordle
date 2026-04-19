/**
 * packages/core — Stage/Step config derived from real problem-set JSON files.
 * Single source of truth for stage/step metadata + puzzle selection.
 */

import { PROBLEM_SETS, selectProblemSetPuzzle } from "./problem-sets";
import { mapProblemSetPuzzleToViewModel } from "./puzzle-adapter";
import type { Stage, StageStep } from "../types/progression";
import type { PuzzleViewModel } from "../types/puzzle";

const STAGE_META: Record<
  number,
  { title: string; description: string; theme: string }
> = {
  1: { title: "초등 산수", description: "기초 덧셈·뺄셈·곱셈·나눗셈", theme: "arithmetic" },
  2: { title: "변수의 세계", description: "미지수와 변수 개념 도입", theme: "variable" },
  3: { title: "연산의 규칙", description: "사칙연산 순서와 괄호", theme: "order-of-operations" },
  4: { title: "문자와 식", description: "문자 변수와 방정식", theme: "algebra" },
  5: { title: "제곱과 뿌리", description: "제곱근과 지수 기초", theme: "roots" },
  6: { title: "복소수의 세계", description: "복소수와 기본 연산", theme: "complex" },
  7: { title: "직선과 함수", description: "직선의 방정식", theme: "linear" },
  8: { title: "지수와 로그", description: "지수·로그 기본", theme: "exponential" },
  9: { title: "미분의 세계", description: "미분법 도입", theme: "calculus" },
  10: { title: "확률과 통계", description: "순열·조합·확률", theme: "probability" },
};

export function getAllStages(): Stage[] {
  return Object.entries(STAGE_META).map(([n, meta]) => ({
    id: `stage-${n}`,
    stageNumber: Number(n),
    title: meta.title,
    theme: meta.theme,
    description: meta.description,
    isPublished: true,
  }));
}

export function getStageByNum(stageNum: number): Stage | null {
  const meta = STAGE_META[stageNum];
  if (!meta) return null;
  return {
    id: `stage-${stageNum}`,
    stageNumber: stageNum,
    ...meta,
    isPublished: true,
  };
}

export function getStepsForStage(stageNum: number): StageStep[] {
  return Array.from({ length: 10 }, (_, i) => {
    const stepNum = i + 1;
    const pool = PROBLEM_SETS[`${stageNum}-${stepNum}`] ?? [];
    const first = pool[0];
    return {
      id: `step-${stageNum}-${stepNum}`,
      stageId: `stage-${stageNum}`,
      stepNumber: stepNum,
      code: `${stageNum}-${stepNum}`,
      title: first?.title ?? `스텝 ${stepNum}`,
      description: null,
      difficulty: (first?.difficulty ?? "easy") as StageStep["difficulty"],
      category: first?.category ?? "arithmetic",
      isBoss: stepNum === 10,
      unlockRule: null,
    };
  });
}

export function getStepByCode(code: string): StageStep | null {
  const [stageStr, stepStr] = code.split("-");
  const stageNum = Number(stageStr);
  const stepNum = Number(stepStr);
  if (isNaN(stageNum) || isNaN(stepNum)) return null;
  const steps = getStepsForStage(stageNum);
  return steps[stepNum - 1] ?? null;
}

export function selectPuzzleForStep(
  stageNum: number,
  stepNum: number,
  seenIds: string[] = []
): PuzzleViewModel | null {
  const pool = PROBLEM_SETS[`${stageNum}-${stepNum}`] ?? [];
  const entry = selectProblemSetPuzzle(pool, seenIds);
  if (!entry) return null;
  return mapProblemSetPuzzleToViewModel(entry);
}
