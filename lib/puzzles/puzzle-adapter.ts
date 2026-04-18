/**
 * lib/puzzles/puzzle-adapter.ts
 *
 * Converts raw PuzzleTransport → normalized PuzzleViewModel.
 *
 * This is the primary extension point for the puzzle engine:
 * when the final puzzle JSON schema is finalized, update the
 * `adaptPuzzle()` function (and its supporting helpers) here —
 * no UI code should need to change.
 *
 * TODO: Replace the MockPuzzlePayload casting once the final
 * raw_payload schema is finalized and validated.
 */

import type { PuzzleTransport, PuzzleViewModel, KeypadGroup, KeypadToken, TokenType } from "@/types/puzzle";
import type { MockPuzzlePayload } from "./mock-puzzles";

// ─── Default keypad layout ────────────────────────────────────────────────────

/**
 * Build keypad groups from an array of allowed token strings.
 *
 * Groups tokens by type automatically. The keypad layout config
 * can also be provided directly from raw_payload in future.
 *
 * TODO: Accept a full keypad layout config from puzzle payload
 * once the schema is finalized.
 */
function buildKeypadGroups(allowedTokens: string[], variables: Record<string, number>): KeypadGroup[] {
  const variableNames = Object.keys(variables);

  const digits: KeypadToken[] = [];
  const operators: KeypadToken[] = [];
  const parens: KeypadToken[] = [];
  const functions: KeypadToken[] = [];
  const constants: KeypadToken[] = [];
  const vars: KeypadToken[] = [];

  const OPERATOR_MAP: Record<string, string> = {
    "*": "×",
    "/": "÷",
    "^": "^",
    "+": "+",
    "-": "−",
    "=": "=",
  };

  const FUNCTION_TOKENS = ["sin", "cos", "tan", "log", "sqrt", "ln", "abs"];
  const CONSTANT_TOKENS = ["pi", "π", "e"];

  for (const token of allowedTokens) {
    if (/^\d$/.test(token) || token === ".") {
      digits.push({ value: token, display: token, type: "digit" });
    } else if (token in OPERATOR_MAP || ["+", "-", "*", "/", "^", "="].includes(token)) {
      const type: TokenType = token === "=" ? "equals" : "operator";
      operators.push({
        value: token,
        display: OPERATOR_MAP[token] ?? token,
        type,
      });
    } else if (token === "(" || token === ")") {
      parens.push({ value: token, display: token, type: "paren" });
    } else if (FUNCTION_TOKENS.includes(token)) {
      functions.push({ value: token, display: token, type: "function" });
    } else if (CONSTANT_TOKENS.includes(token)) {
      const display = token === "pi" ? "π" : token;
      constants.push({ value: token, display, type: "constant" });
    } else if (variableNames.includes(token)) {
      vars.push({ value: token, display: token, type: "variable" });
    } else {
      // Unknown tokens go into operators as a fallback
      operators.push({ value: token, display: token, type: "operator" });
    }
  }

  const groups: KeypadGroup[] = [];

  if (digits.length > 0) {
    // Sort digits 7-8-9, 4-5-6, 1-2-3, 0, .
    const orderedDigits = ["7","8","9","4","5","6","1","2","3","0","."]
      .filter((d) => digits.some((t) => t.value === d))
      .map((d) => digits.find((t) => t.value === d)!);
    groups.push({ id: "numbers", label: "숫자", tokens: orderedDigits });
  }

  if (operators.length > 0) {
    groups.push({ id: "operators", label: "연산자", tokens: operators });
  }

  if (parens.length > 0) {
    groups.push({ id: "parens", label: "괄호", tokens: parens });
  }

  if (functions.length > 0) {
    groups.push({ id: "functions", label: "함수", tokens: functions });
  }

  if (constants.length > 0) {
    groups.push({ id: "constants", label: "상수", tokens: constants });
  }

  if (vars.length > 0) {
    groups.push({ id: "variables", label: "변수", tokens: vars });
  }

  return groups;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * Convert a raw PuzzleTransport into a normalized PuzzleViewModel.
 *
 * Extension point: swap the body of this function when the final
 * puzzle engine is ready. The return type (PuzzleViewModel) must not change.
 */
export function adaptPuzzle(transport: PuzzleTransport): PuzzleViewModel {
  // TODO: Replace this cast once raw_payload schema is finalized.
  // For now we treat raw_payload as MockPuzzlePayload.
  const payload = transport.raw_payload as MockPuzzlePayload;

  const variables = payload.variables ?? {};
  const allowedTokens = payload.allowedTokens ?? [];
  const maxAttempts = payload.maxAttempts ?? 6;
  const tokenLength = transport.token_length ?? payload.answer?.length ?? 5;

  const displayPayload = transport.display_payload as
    | { hint?: string; subtitle?: string; context?: Record<string, string | number> }
    | null;

  const contextEntries: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(variables)) {
    contextEntries[k] = v;
  }
  const displayContext = displayPayload?.context ?? contextEntries;

  return {
    id: transport.id,
    title: transport.title,
    type: transport.type,
    difficulty: transport.difficulty ?? "medium",
    category: transport.category,
    explanation: transport.explanation,
    tokenLength,
    maxAttempts,
    availableTokenGroups: buildKeypadGroups(allowedTokens, variables),
    displayInfo: {
      hint: displayPayload?.hint,
      subtitle: displayPayload?.subtitle,
      context: Object.keys(displayContext).length > 0 ? displayContext : undefined,
    },
    dailyDate: transport.daily_date,
    isDaily: transport.is_daily,
    meta: {
      // Store the original payload data for the validator
      answer: payload.answer,
      variables,
      allowedTokens,
      validationStatus: transport.validation_status,
      slug: transport.slug,
    },
  };
}

/**
 * Extract validation context from a PuzzleViewModel.
 * Used by the server-side validator to check guesses.
 *
 * TODO: This will be replaced when the final puzzle engine
 * provides its own validation interface.
 */
export function extractValidationContext(vm: PuzzleViewModel) {
  return {
    length: vm.tokenLength,
    allowedTokens: (vm.meta.allowedTokens as string[]) ?? [],
    variables: (vm.meta.variables as Record<string, number>) ?? {},
    answer: (vm.meta.answer as string) ?? "",
  };
}
