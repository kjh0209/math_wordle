/**
 * lib/puzzles/puzzle-normalizer.ts
 *
 * Converts a validated PuzzleRawPayload into the flat column shape
 * required by the `puzzles` Supabase table.
 *
 * Keeps raw_payload intact — the DB is the canonical store.
 */

import type { PuzzleRawPayload } from "@mathdle/core";

export interface NormalizedPuzzleRow {
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
  rules: Record<string, unknown>;
  shown_tokens: string[];
  shown_blocks: string[];
  raw_payload: PuzzleRawPayload;
  has_variable: boolean;
  is_daily: boolean;
  daily_date: string | null;
  is_public: boolean;
  source_type: string;
  created_by: string | null;
}

export function normalizePuzzle(
  raw: PuzzleRawPayload,
  options: {
    sourceType?: string;
    createdBy?: string;
    isDaily?: boolean;
    dailyDate?: string | null;
    isPublic?: boolean;
  } = {}
): NormalizedPuzzleRow {
  return {
    id: raw.id,
    title: raw.title,
    level: raw.level,
    difficulty: raw.difficulty,
    category: raw.category,

    variable_name: raw.variable?.name ?? null,
    variable_value_expression: raw.variable?.valueExpression ?? null,
    variable_value_display: raw.variable?.valueDisplay ?? null,

    answer_expression: raw.answer.expression,
    answer_display: raw.answer.display,
    answer_length: raw.answer.length,

    rules: raw.rules as Record<string, unknown>,
    shown_tokens: raw.shownTokens,
    shown_blocks: raw.shownBlocks,

    raw_payload: raw,

    has_variable: raw.variable !== null && raw.variable !== undefined,
    is_daily: options.isDaily ?? false,
    daily_date: options.dailyDate ?? null,
    is_public: options.isPublic ?? true,

    source_type: options.sourceType ?? "imported-json",
    created_by: options.createdBy ?? null,
  };
}
