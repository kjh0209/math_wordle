/**
 * packages/core — Finalized puzzle types
 * Based on mathle-spec.json. Used by both web and mobile.
 */

import type {
  PuzzleLevel,
  PuzzleDifficulty,
  PuzzleCategory,
  ReservedBlock,
} from "./spec";

export type { PuzzleLevel, PuzzleDifficulty, PuzzleCategory, ReservedBlock };

// ─── Cells ────────────────────────────────────────────────────────────────────

/** A single token cell (one reserved token or digit) */
export interface TokenCell {
  type: "token";
  value: string;
}

/** A single block cell (a named math construct with typed fields) */
export interface BlockCell {
  type: "block";
  blockType: ReservedBlock;
  fields: Record<string, string>;
  /**
   * For the JSON spec, 'fields' contains raw string expressions (e.g. "0").
   * During play, 'cellFields' contains the actual user input as token arrays.
   */
  cellFields?: Record<string, PuzzleCell[]>;
}

/** A single cell in a puzzle answer or player guess */
export type PuzzleCell = TokenCell | BlockCell;

/**
 * Stable key for a cell — used for Wordle-style "present" detection.
 * For blocks, only blockType is used so that a block with wrong parameters
 * is still recognized as the same block type (green/yellow), while its
 * internal parameter slots are compared separately via nested paths.
 */
export function cellKey(cell: PuzzleCell): string {
  if (cell.type === "token") return `t:${cell.value}`;
  return `b:${cell.blockType}`;
}

/** Key for keyboard state coloring (block buttons use blockType only) */
export function cellDisplayKey(cell: PuzzleCell): string {
  if (cell.type === "token") return cell.value;
  return cell.blockType;
}

// ─── Answer ───────────────────────────────────────────────────────────────────

export interface PuzzleAnswer {
  expression: string;
  display: string;
  cells: PuzzleCell[];
  length: number;
}

// ─── Variable ─────────────────────────────────────────────────────────────────

export interface PuzzleVariable {
  name: string;
  valueExpression: string;
  valueDisplay: string;
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export interface PuzzleRules {
  requiresVariable?: boolean;
  allowImplicitMultiplication?: boolean;
  maxAttempts?: number;
}

// ─── Raw payload (the puzzle JSON file format) ────────────────────────────────

/** The canonical puzzle JSON shape — source of truth for all puzzle data. */
export interface PuzzleRawPayload {
  id: string;
  level: PuzzleLevel;
  title: string;
  variable: PuzzleVariable | null;
  answer: PuzzleAnswer;
  difficulty: PuzzleDifficulty;
  category: PuzzleCategory;
  rules: PuzzleRules;
  shownTokens: string[];
  shownBlocks: ReservedBlock[];
  explanation?: string;
  metadata?: Record<string, unknown>;
}

// ─── DB row (Supabase `puzzles` table) ───────────────────────────────────────

/** Shape of a row returned from the Supabase `puzzles` table */
export interface PuzzleDbRow {
  id: string;
  title: string;
  level: string;
  difficulty: string;
  category: string;
  variable_name: string | null;
  variable_value_expression: string | null;
  variable_value_display: string | null;
  answer_expression: string;
  answer_display: string;
  answer_length: number;
  rules: PuzzleRules;
  shown_tokens: string[];
  shown_blocks: string[];
  raw_payload: PuzzleRawPayload;
  has_variable: boolean;
  is_daily: boolean;
  daily_date: string | null;
  is_public: boolean;
  source_type: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Domain model ─────────────────────────────────────────────────────────────

/** Normalized business-layer representation after mapping from DB */
export interface PuzzleDomainModel {
  id: string;
  title: string;
  level: PuzzleLevel;
  difficulty: PuzzleDifficulty;
  category: PuzzleCategory;
  variable: PuzzleVariable | null;
  answer: PuzzleAnswer;
  rules: Required<PuzzleRules>;
  shownTokens: string[];
  shownBlocks: ReservedBlock[];
  explanation: string | null;
  isDaily: boolean;
  dailyDate: string | null;
  isPublic: boolean;
}

// ─── Keypad types ─────────────────────────────────────────────────────────────

export type TokenType =
  | "digit"
  | "operator"
  | "function"
  | "variable"
  | "constant"
  | "paren"
  | "equals"
  | "decimal"
  | "action"
  | "block";

export interface KeypadToken {
  value: string;
  display: string;
  type: TokenType;
  width?: "normal" | "wide";
  disabled?: boolean;
  // Block-type extras (present when type === "block")
  blockType?: ReservedBlock;
  blockFieldCount?: number;
  blockFieldNames?: string[];
}

export interface KeypadGroup {
  id: string;
  label: string;
  tokens: KeypadToken[];
}

// ─── View model (client-safe, no answer) ─────────────────────────────────────

/**
 * What the UI receives. The answer cells / expression are stripped by the
 * API layer. For offline mobile use, they are available in `meta`.
 */
export interface PuzzleViewModel {
  id: string;
  title: string;
  level: PuzzleLevel;
  difficulty: PuzzleDifficulty;
  category: PuzzleCategory;
  variable: PuzzleVariable | null;
  answerDisplay: string;
  answerLength: number;
  maxAttempts: number;
  shownTokens: string[];
  shownBlocks: ReservedBlock[];
  availableTokenGroups: KeypadGroup[];
  explanation: string | null;
  isDaily: boolean;
  dailyDate: string | null;
  /**
   * Server-only fields — stripped before sending to client.
   * Available when loaded from local mock data (mobile offline mode).
   */
  meta: {
    answerCells?: PuzzleCell[];
    answerExpression?: string;
    variableValue?: Record<string, number>;
  };
}

// ─── Summary (for admin / list views) ────────────────────────────────────────

export interface PuzzleSummary {
  id: string;
  title: string;
  level: string;
  difficulty: string;
  category: string;
  isDaily: boolean;
  dailyDate: string | null;
  isPublic: boolean;
  sourceType: string;
  hasVariable: boolean;
  createdAt: string;
}

// ─── Import job ───────────────────────────────────────────────────────────────

export interface PuzzleImportJob {
  id: string;
  sourceName: string | null;
  status: "pending" | "success" | "failed";
  importedCount: number;
  failedCount: number;
  errorLog: unknown | null;
  createdAt: string;
}

// ─── Generation job ───────────────────────────────────────────────────────────

export interface PuzzleGenerationJob {
  id: string;
  requestedLevel: string | null;
  requestedDifficulty: string | null;
  requestedCategory: string | null;
  requestedConstraints: unknown | null;
  status: "pending" | "success" | "failed";
  model: string | null;
  parsedPayload: PuzzleRawPayload | null;
  errorMessage: string | null;
  createdPuzzleId: string | null;
  createdAt: string;
}

// ─── Kept for backward compatibility in any remaining usages ─────────────────

/** @deprecated Use PuzzleCell from now on */
export interface TokenUnit {
  value: string;
  display: string;
  type: string;
}

/** @deprecated Use PuzzleDbRow */
export type PuzzleTransport = PuzzleDbRow;

/** @deprecated Use PuzzleSummary */
export type ValidationStatus = "draft" | "valid" | "rejected" | "published";
