/**
 * lib/game/validator.ts
 *
 * Public validation API used by /api/validate-guess.
 *
 * validateInputCells()  — primary entry point; takes raw InputCell[] from the client.
 *   Returns a typed ValidationOutcome distinguishing:
 *     "syntax"  — expression is structurally malformed
 *     "eval"    — expression is valid but the equation doesn't balance
 *     "ok"      — valid, balanced equation (ready for Wordle comparison)
 *
 * compareGuess() — Wordle-style per-cell color feedback.
 * colorPriority() — keyboard state helper.
 */

import type { InputCell, TokenUnit, BlockCell } from "@/types/puzzle";
import type { FeedbackColor } from "@/types/game";
import { parseCells, validateEquation } from "./parser";

// ─── Outcome types ────────────────────────────────────────────────────────────

export type ValidationOutcome =
  | { ok: true }
  | { ok: false; errorKind: "syntax" | "eval"; message: string };

// ─── Main entry point ─────────────────────────────────────────────────────────

export function validateInputCells(
  cells: InputCell[],
  scope: Record<string, number> = {}
): ValidationOutcome {
  // Phase 1: parse structure
  const parseResult = parseCells(cells);
  if (!parseResult.ok) {
    return { ok: false, errorKind: parseResult.errorKind, message: parseResult.message };
  }

  // Phase 2: evaluate equation
  const evalResult = validateEquation(parseResult.ast, scope);
  if (!evalResult.ok) {
    return { ok: false, errorKind: evalResult.errorKind, message: evalResult.message };
  }

  return { ok: true };
}

// ─── Wordle comparison ────────────────────────────────────────────────────────

/**
 * Compare a guess cell array against the answer cell array.
 * Each position gets: "correct" | "present" | "absent".
 *
 * Cell identity:
 *   - TokenCell  → compared by .value
 *   - BlockCell  → compared by blockType + JSON-serialized fields
 */
export function compareGuess(
  guess: InputCell[],
  answer: InputCell[]
): FeedbackColor[] {
  const len = answer.length;
  const colors: FeedbackColor[] = Array(len).fill("absent");
  const used = Array(len).fill(false);

  const key = (c: InputCell): string =>
    c.type === "block"
      ? `block:${(c as BlockCell).blockType}:${JSON.stringify((c as BlockCell).fields)}`
      : `token:${(c as TokenUnit).value}`;

  const guessKeys = guess.map(key);
  const answerKeys = answer.map(key);

  // First pass: exact position matches
  for (let i = 0; i < len; i++) {
    if (guessKeys[i] === answerKeys[i]) {
      colors[i] = "correct";
      used[i] = true;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < len; i++) {
    if (colors[i] === "correct") continue;
    for (let j = 0; j < len; j++) {
      if (!used[j] && guessKeys[i] === answerKeys[j]) {
        colors[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return colors;
}

// ─── Keyboard state helper ────────────────────────────────────────────────────

export function colorPriority(color: FeedbackColor): number {
  if (color === "correct") return 3;
  if (color === "present") return 2;
  return 1;
}

// ─── Legacy string-based helpers (kept for backward compat / migration) ───────

/** @deprecated Use validateInputCells() instead */
export type ValidationResult = { ok: true } | { ok: false; message: string };

/** @deprecated Use validateInputCells() instead */
export function normalizeExpression(input: string): string {
  return input.replace(/\s+/g, "");
}

/** @deprecated Use colorPriority() directly */
export { colorPriority as default };
