import { all, create } from "mathjs";
import type { FeedbackColor, Puzzle } from "@/lib/types";

const math = create(all, {});

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function normalizeExpression(input: string) {
  return input.replace(/\s+/g, "");
}

export function validateLength(input: string, expected: number): ValidationResult {
  return input.length === expected
    ? { ok: true }
    : { ok: false, message: `수식 길이는 ${expected}칸이어야 합니다.` };
}

export function validateAllowedTokens(input: string, allowed: string[]): ValidationResult {
  for (const ch of input.split("")) {
    if (!allowed.includes(ch)) {
      return { ok: false, message: `허용되지 않은 문자입니다: ${ch}` };
    }
  }
  return { ok: true };
}

export function validateParentheses(input: string): ValidationResult {
  let balance = 0;
  for (const ch of input) {
    if (ch === "(") balance += 1;
    if (ch === ")") balance -= 1;
    if (balance < 0) return { ok: false, message: "괄호가 올바르지 않습니다." };
  }
  return balance === 0 ? { ok: true } : { ok: false, message: "괄호가 올바르지 않습니다." };
}

export function validateExpressionShape(input: string): ValidationResult {
  const equalsCount = (input.match(/=/g) || []).length;
  if (equalsCount !== 1) return { ok: false, message: "등호(=)는 정확히 1개여야 합니다." };

  const [left, right] = input.split("=");
  if (!left || !right) return { ok: false, message: "좌변과 우변이 모두 필요합니다." };

  if (/[+\-*/]{2,}/.test(left) || /[+\-*/]{2,}/.test(right)) {
    return { ok: false, message: "연산자가 연속으로 올 수 없습니다." };
  }

  return validateParentheses(input);
}

export function evaluateEquality(input: string, variables: Record<string, number>): ValidationResult {
  try {
    const [left, right] = input.split("=");
    const leftVal = math.evaluate(left, variables);
    const rightVal = math.evaluate(right, variables);

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
      : { ok: false, message: "수식은 문법적으로 맞지만 등식이 성립하지 않습니다." };
  } catch {
    return { ok: false, message: "올바르지 않은 수식입니다." };
  }
}

export function validateGuess(guess: string, puzzle: Puzzle): ValidationResult {
  const normalized = normalizeExpression(guess);
  const checks = [
    validateLength(normalized, puzzle.length),
    validateAllowedTokens(normalized, puzzle.allowedTokens),
    validateExpressionShape(normalized),
    evaluateEquality(normalized, puzzle.variables),
  ];
  for (const check of checks) {
    if (!check.ok) return check;
  }
  return { ok: true };
}

export function compareGuess(guess: string, answer: string): FeedbackColor[] {
  const colors: FeedbackColor[] = Array.from({ length: answer.length }, () => "absent");
  const answerChars = answer.split("");
  const guessChars = guess.split("");
  const used = Array.from({ length: answer.length }, () => false);

  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === answerChars[i]) {
      colors[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < guessChars.length; i++) {
    if (colors[i] === "correct") continue;
    for (let j = 0; j < answerChars.length; j++) {
      if (!used[j] && guessChars[i] === answerChars[j]) {
        colors[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return colors;
}

export function buildShareText(
  puzzleId: string,
  solved: boolean,
  attemptsUsed: number,
  maxAttempts: number,
  rows: FeedbackColor[]
): string {
  const title = `Mathle ${puzzleId} ${solved ? `${attemptsUsed}/${maxAttempts}` : `X/${maxAttempts}`}`;
  const body = rows.map((row) => {
    if (row === "correct") return "🟩";
    if (row === "present") return "🟨";
    return "⬛";
  }).join("");
  return `${title}\n${body}`;
}

export function colorPriority(color: FeedbackColor): number {
  if (color === "correct") return 3;
  if (color === "present") return 2;
  return 1;
}
