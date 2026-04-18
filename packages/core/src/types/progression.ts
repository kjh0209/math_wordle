/**
 * packages/core/src/types/progression.ts
 *
 * Domain models for the stage-based progression system.
 */

import type { FeedbackColor } from "./game";
import type { PuzzleCell } from "./puzzle";

// ─── 1. Stage (World) ─────────────────────────────────────────────────────────

export interface Stage {
  id: string;
  stageNumber: number;
  title: string;
  theme: string | null;
  description: string | null;
  isPublished: boolean;
}

// ─── 2. Stage Step ────────────────────────────────────────────────────────────

export interface StageStep {
  id: string;
  stageId: string;
  stepNumber: number;
  code: string; // e.g. "1-1"
  title: string;
  description: string | null;
  difficulty: string | null;
  category: string | null;
  isBoss: boolean;
  unlockRule: unknown | null;
}

// ─── 3. Step Puzzle Pool ──────────────────────────────────────────────────────

export interface StepPuzzlePoolEntry {
  id: string;
  stageStepId: string;
  puzzleId: string;
  variantOrder: number;
  weight: number;
  isActive: boolean;
}

// ─── 4. Play Session ──────────────────────────────────────────────────────────

export interface PlaySession {
  id: string;
  createdAt: string;
}

// ─── 5. Step Attempt Run ──────────────────────────────────────────────────────

export type StepRunStatus = "playing" | "cleared" | "failed" | "abandoned";

export interface StepRunGuess {
  cells: PuzzleCell[];
  feedback: FeedbackColor[];
}

export interface StepRun {
  id: string;
  playSessionId: string;
  stageStepId: string;
  puzzleId: string;    // The specific variant selected for this run
  runIndex: number;    // E.g. 1st try, 2nd try of this step in this session
  status: StepRunStatus;
  attemptsCount: number;
  maxAttempts: number;
  clearTimeMs: number | null;
  guessHistory: StepRunGuess[];
  startedAt: string;
  completedAt: string | null;
}

// ─── 6. User Step Progress ────────────────────────────────────────────────────

export interface UserStepProgress {
  id: string;
  playSessionId: string;
  stageStepId: string;
  unlocked: boolean;
  cleared: boolean;
  bestAttemptsCount: number | null;
  bestClearTimeMs: number | null;
  clearsCount: number;
  failuresCount: number;
  seenPuzzleIds: string[]; // Puzzle IDs that have been played
  firstClearedAt: string | null;
  lastPlayedAt: string | null;
}

// ─── 7. User Stage Progress ───────────────────────────────────────────────────

export interface UserStageProgress {
  id: string;
  playSessionId: string;
  stageId: string;
  unlocked: boolean;
  clearedStepsCount: number;
  bossCleared: boolean;
}

// ─── View Models & Aggregates ────────────────────────────────────────────────

/** A stage with its steps attached, useful for the Stage Detail screen */
export interface StageWithSteps extends Stage {
  steps: StageStep[];
}

/** Aggregated status for mapping UI */
export interface StageMapNode {
  stage: Stage;
  progress: UserStageProgress | null;
}

/** Overview of a step including user's progress for it */
export interface StepOverview {
  step: StageStep;
  progress: UserStepProgress | null;
}
