/**
 * packages/core — Cell-based guess validator
 *
 * Validation strategy:
 *   1. Cell count check (always)
 *   2. Allowed cells check (shownTokens / shownBlocks)
 *   3. Expression equality check (best-effort; skipped for unsupported block types)
 *
 * Platform-agnostic: used by both web (server-side) and mobile (client-side).
 */

import { all, create } from "mathjs";
import type { PuzzleCell, PuzzleDomainModel, ReservedBlock } from "../types/puzzle";
import { cellKey } from "../types/puzzle";
import type { FeedbackColor } from "../types/game";

const math = create(all, {});

export type ValidationResult = { ok: true } | { ok: false; message: string };

// ─── Cell count ───────────────────────────────────────────────────────────────

export function validateCellCount(
  cells: PuzzleCell[],
  expected: number
): ValidationResult {
  return cells.length === expected
    ? { ok: true }
    : { ok: false, message: `${expected}칸을 모두 채워주세요. (현재 ${cells.length}칸)` };
}

// ─── Allowed cells ────────────────────────────────────────────────────────────

export function validateAllowedCells(
  cells: PuzzleCell[],
  shownTokens: string[],
  shownBlocks: ReservedBlock[]
): ValidationResult {
  for (const cell of cells) {
    if (cell.type === "token") {
      if (!shownTokens.includes(cell.value)) {
        return { ok: false, message: `허용되지 않은 토큰: "${cell.value}"` };
      }
    } else {
      if (!shownBlocks.includes(cell.blockType)) {
        return { ok: false, message: `허용되지 않은 블록: "${cell.blockType}"` };
      }
    }
  }
  return { ok: true };
}

// ─── Expression builder ───────────────────────────────────────────────────────

/**
 * Build a mathjs-evaluable expression string from cells.
 * Returns null when cells contain unsupported block types for evaluation.
 */
export function buildExpression(
  cells: PuzzleCell[],
  variableValue?: Record<string, number>
): string | null {
  const parts: string[] = [];

  for (const cell of cells) {
    if (cell.type === "token") {
      const v = cell.value;
      // Substitute variable values for equality evaluation
      if (variableValue && v in variableValue) {
        parts.push(String(variableValue[v]));
      } else {
        // Map token values to mathjs syntax
        if (v === "pi") parts.push("pi");
        else if (v === "sqrt") parts.push("sqrt");
        else parts.push(v);
      }
    } else {
      // Build mathjs-compatible expression for blocks
      switch (cell.blockType) {
        case "LogBase":
          parts.push(`log(, ${cell.fields.base ?? "10"})`);
          return null; // partial — need content inside; skip equality check
        case "SigmaRange":
          return null; // mathjs doesn't support sigma natively; skip
        case "IntegralRange":
          return null; // skip
        case "dx":
          return null; // skip (only makes sense in integral context)
        case "Comb": {
          const n = parseInt(cell.fields.n ?? "0");
          const r = parseInt(cell.fields.r ?? "0");
          // C(n,r) = n! / (r! * (n-r)!)
          parts.push(String(combination(n, r)));
          break;
        }
        case "Perm": {
          const n = parseInt(cell.fields.n ?? "0");
          const r = parseInt(cell.fields.r ?? "0");
          // P(n,r) = n! / (n-r)!
          parts.push(String(permutation(n, r)));
          break;
        }
        default:
          return null;
      }
    }
  }

  return convertAbsoluteValue(parts.join(""));
}

/** Convert |expr| notation to abs(expr) for mathjs compatibility */
function convertAbsoluteValue(expr: string): string {
  let result = expr;
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(/\|([^|]*)\|/g, "abs($1)");
  }
  return result;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function combination(n: number, r: number): number {
  if (r > n || r < 0) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function permutation(n: number, r: number): number {
  if (r > n || r < 0) return 0;
  return factorial(n) / factorial(n - r);
}

// ─── Equality check ───────────────────────────────────────────────────────────

export function evaluateCellEquality(
  cells: PuzzleCell[],
  variableValue?: Record<string, number>
): ValidationResult {
  try {
    const expr = buildExpression(cells, variableValue);
    if (expr === null) {
      // Can't evaluate — skip this check (trust server to validate)
      return { ok: true };
    }

    const parts = expr.split("=");
    if (parts.length !== 2) {
      return { ok: false, message: "등호(=)는 정확히 1개여야 합니다." };
    }

    const [left, right] = parts;
    if (!left || !right) {
      return { ok: false, message: "좌변과 우변이 모두 필요합니다." };
    }

    const leftVal = math.evaluate(left);
    const rightVal = math.evaluate(right);

    if (
      typeof leftVal !== "number" ||
      typeof rightVal !== "number" ||
      !Number.isFinite(leftVal) ||
      !Number.isFinite(rightVal)
    ) {
      return { ok: false, message: "계산 결과가 유효하지 않습니다." };
    }

    return Math.abs(leftVal - rightVal) < 1e-9
      ? { ok: true }
      : { ok: false, message: "수식은 올바르지만 등식이 성립하지 않습니다." };
  } catch {
    return { ok: false, message: "올바르지 않은 수식입니다." };
  }
}

// ─── Main validate entry point ────────────────────────────────────────────────

/** Validate a player's guess (as cells) against the puzzle domain model */
export function validateGuessCells(
  guessCells: PuzzleCell[],
  puzzle: PuzzleDomainModel
): ValidationResult {
  const checks: ValidationResult[] = [
    validateCellCount(guessCells, puzzle.answer.length),
    validateAllowedCells(guessCells, puzzle.shownTokens, puzzle.shownBlocks),
    evaluateCellEquality(guessCells, getVariableValues(puzzle)),
  ];

  for (const check of checks) {
    if (!check.ok) return check;
  }
  return { ok: true };
}

function getVariableValues(
  puzzle: PuzzleDomainModel
): Record<string, number> | undefined {
  if (!puzzle.variable) return undefined;
  try {
    const val = math.evaluate(puzzle.variable.valueExpression) as number;
    if (typeof val === "number" && isFinite(val)) {
      return { [puzzle.variable.name]: val };
    }
  } catch {
    // fallback: try parseFloat
    const val = parseFloat(puzzle.variable.valueExpression);
    if (!isNaN(val)) return { [puzzle.variable.name]: val };
  }
  return undefined;
}

// ─── Wordle-style cell comparison ─────────────────────────────────────────────

/**
 * Compare guess cells against answer cells and produce per-cell feedback.
 * Uses cellKey() for equality so block cells with different fields are distinct.
 */
export function compareGuessCells(
  guessCells: PuzzleCell[],
  answerCells: PuzzleCell[]
): FeedbackColor[] {
  const len = answerCells.length;
  const colors: FeedbackColor[] = Array(len).fill("absent");
  const answerKeys = answerCells.map(cellKey);
  const guessKeys = guessCells.map(cellKey);
  const used = Array(len).fill(false);

  // First pass: exact position match
  for (let i = 0; i < len; i++) {
    if (guessKeys[i] === answerKeys[i]) {
      colors[i] = "correct";
      used[i] = true;
    }
  }

  // Second pass: present in wrong position
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

export function colorPriority(color: FeedbackColor): number {
  if (color === "correct") return 3;
  if (color === "present") return 2;
  return 1;
}

// ─── Legacy string-based helpers (kept for backward compatibility) ─────────────

/** @deprecated Use validateGuessCells */
export function validateGuess(
  guess: string,
  ctx: { length: number; allowedTokens: string[]; variables: Record<string, number> }
): ValidationResult {
  if (guess.length !== ctx.length) {
    return { ok: false, message: `수식 길이는 ${ctx.length}칸이어야 합니다.` };
  }
  return { ok: true };
}

/** @deprecated Use compareGuessCells */
export function compareGuess(guess: string, answer: string): FeedbackColor[] {
  const len = answer.length;
  const colors: FeedbackColor[] = Array(len).fill("absent");
  const answerChars = answer.split("");
  const guessChars = guess.split("");
  const used = Array(len).fill(false);
  for (let i = 0; i < len; i++) {
    if (guessChars[i] === answerChars[i]) { colors[i] = "correct"; used[i] = true; }
  }
  for (let i = 0; i < len; i++) {
    if (colors[i] === "correct") continue;
    for (let j = 0; j < len; j++) {
      if (!used[j] && guessChars[i] === answerChars[j]) {
        colors[i] = "present"; used[j] = true; break;
      }
    }
  }
  return colors;
}

export function normalizeExpression(input: string): string {
  return input.replace(/\s+/g, "");
}

export type { ValidationResult as PuzzleValidationContext };
