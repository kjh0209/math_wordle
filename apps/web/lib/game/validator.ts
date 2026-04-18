/**
 * lib/game/validator.ts
 *
 * Core guess validation and comparison logic.
 *
 * This module is intentionally decoupled from the final puzzle schema.
 * It receives already-normalized strings (joined token values) and
 * a minimal puzzle context interface.
 *
 * TODO: When the final puzzle engine is integrated, replace the
 * `PuzzleValidationContext` interface and swap in the real validator
 * without touching any UI code.
 */

import { all, create } from "mathjs";
import type { FeedbackColor } from "@/types/game";

const math = create(all, {});

export type ValidationResult = { ok: true } | { ok: false; message: string };

/**
 * Minimal puzzle context required for validation.
 * Intentionally small — the real puzzle engine will satisfy this interface.
 *
 * TODO: Expand this interface once the final puzzle schema is finalized.
 */
export interface PuzzleValidationContext {
  /** Expected total character count */
  length: number;
  /** Set of characters/tokens that are valid input */
  allowedTokens: string[];
  /** Variable bindings for evaluation (e.g., { x: 3 }) */
  variables: Record<string, number>;
}

// ─── Individual checks ───────────────────────────────────────────────────────

export function normalizeExpression(input: string): string {
  return input.replace(/\s+/g, "");
}

export function validateLength(
  input: string,
  expected: number
): ValidationResult {
  return input.length === expected
    ? { ok: true }
    : { ok: false, message: `수식 길이는 ${expected}칸이어야 합니다.` };
}

export function validateAllowedTokens(
  input: string,
  allowed: string[]
): ValidationResult {
  // Support both single-char and multi-char tokens
  // Try to greedily match longest tokens first
  const sorted = [...allowed].sort((a, b) => b.length - a.length);
  let remaining = input;
  while (remaining.length > 0) {
    const matched = sorted.find((t) => remaining.startsWith(t));
    if (!matched) {
      return {
        ok: false,
        message: `허용되지 않은 문자입니다: "${remaining[0]}"`,
      };
    }
    remaining = remaining.slice(matched.length);
  }
  return { ok: true };
}

export function validateParentheses(input: string): ValidationResult {
  let balance = 0;
  for (const ch of input) {
    if (ch === "(") balance += 1;
    if (ch === ")") balance -= 1;
    if (balance < 0)
      return { ok: false, message: "괄호가 올바르지 않습니다." };
  }
  return balance === 0
    ? { ok: true }
    : { ok: false, message: "괄호가 올바르지 않습니다." };
}

export function validateExpressionShape(input: string): ValidationResult {
  const equalsCount = (input.match(/=/g) ?? []).length;
  if (equalsCount !== 1)
    return { ok: false, message: "등호(=)는 정확히 1개여야 합니다." };

  const [left, right] = input.split("=");
  if (!left || !right)
    return { ok: false, message: "좌변과 우변이 모두 필요합니다." };

  if (/[+\-*/]{2,}/.test(left) || /[+\-*/]{2,}/.test(right)) {
    return { ok: false, message: "연산자가 연속으로 올 수 없습니다." };
  }

  return validateParentheses(input);
}

export function evaluateEquality(
  input: string,
  variables: Record<string, number>
): ValidationResult {
  try {
    const [left, right] = input.split("=");
    const scope = { ...variables };
    const leftVal = math.evaluate(left, scope);
    const rightVal = math.evaluate(right, scope);

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
      : {
          ok: false,
          message: "수식은 올바르지만 등식이 성립하지 않습니다.",
        };
  } catch {
    return { ok: false, message: "올바르지 않은 수식입니다." };
  }
}

// ─── Main validate entry point ────────────────────────────────────────────────

/**
 * Run all validation checks in order.
 * Returns the first failure encountered, or ok:true.
 */
export function validateGuess(
  guess: string,
  ctx: PuzzleValidationContext
): ValidationResult {
  const normalized = normalizeExpression(guess);
  const checks: ValidationResult[] = [
    validateLength(normalized, ctx.length),
    validateAllowedTokens(normalized, ctx.allowedTokens),
    validateExpressionShape(normalized),
    evaluateEquality(normalized, ctx.variables),
  ];
  for (const check of checks) {
    if (!check.ok) return check;
  }
  return { ok: true };
}

// ─── Comparison (Wordle-style feedback) ──────────────────────────────────────

/**
 * Compare a guess against the answer and produce per-token feedback.
 *
 * Works on joined string form (each character is a token slot).
 * TODO: Update to support multi-character token comparison once
 * the final puzzle token model is finalized.
 */
export function compareGuess(
  guess: string,
  answer: string
): FeedbackColor[] {
  const len = answer.length;
  const colors: FeedbackColor[] = Array(len).fill("absent");
  const answerChars = answer.split("");
  const guessChars = guess.split("");
  const used = Array(len).fill(false);

  // First pass: exact matches
  for (let i = 0; i < len; i++) {
    if (guessChars[i] === answerChars[i]) {
      colors[i] = "correct";
      used[i] = true;
    }
  }

  // Second pass: present-but-wrong-position
  for (let i = 0; i < len; i++) {
    if (colors[i] === "correct") continue;
    for (let j = 0; j < len; j++) {
      if (!used[j] && guessChars[i] === answerChars[j]) {
        colors[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return colors;
}

// ─── Keyboard state helpers ───────────────────────────────────────────────────

export function colorPriority(color: FeedbackColor): number {
  if (color === "correct") return 3;
  if (color === "present") return 2;
  return 1;
}
