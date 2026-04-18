/**
 * lib/puzzles/puzzle-adapter.ts
 *
 * Converts PuzzleTransport → PuzzleViewModel.
 * Extension point: swap adaptPuzzle() body when the final puzzle engine is ready.
 */

import type {
  PuzzleTransport,
  PuzzleViewModel,
  KeypadGroup,
  KeypadToken,
  BlockKeypadToken,
  TokenType,
  InputCell,
  TokenUnit,
  BlockType,
} from "@/types/puzzle";
import type { MockPuzzlePayload } from "./mock-puzzles";

// ─── Block keypad metadata ────────────────────────────────────────────────────

const BLOCK_KEYPAD_TOKENS: Record<BlockType, BlockKeypadToken> = {
  LogBase: {
    type: "block",
    blockType: "LogBase",
    display: "log_()",
    fieldLabels: { base: "밑 (base)" },
  },
  SigmaRange: {
    type: "block",
    blockType: "SigmaRange",
    display: "Σ[ , ]",
    fieldLabels: { start: "시작", end: "끝" },
  },
  IntegralRange: {
    type: "block",
    blockType: "IntegralRange",
    display: "∫[ , ]",
    fieldLabels: { start: "하한", end: "상한" },
  },
  dx: {
    type: "block",
    blockType: "dx",
    display: "dx",
    fieldLabels: {},
  },
  Comb: {
    type: "block",
    blockType: "Comb",
    display: "C( , )",
    fieldLabels: { n: "n", r: "r" },
  },
  Perm: {
    type: "block",
    blockType: "Perm",
    display: "P( , )",
    fieldLabels: { n: "n", r: "r" },
  },
};

// ─── Block display builder ────────────────────────────────────────────────────

export function buildBlockDisplay(blockType: BlockType, fields: Record<string, string>): string {
  switch (blockType) {
    case "LogBase": return `log${fields["base"] ? `_${fields["base"]}` : ""}`;
    case "SigmaRange": return `Σ[${fields["start"] ?? ""},${fields["end"] ?? ""}]`;
    case "IntegralRange": return `∫[${fields["start"] ?? ""},${fields["end"] ?? ""}]`;
    case "dx": return "dx";
    case "Comb": return `C(${fields["n"] ?? ""},${fields["r"] ?? ""})`;
    case "Perm": return `P(${fields["n"] ?? ""},${fields["r"] ?? ""})`;
  }
}

// ─── Keypad builder ───────────────────────────────────────────────────────────

function buildKeypadGroups(
  allowedTokens: string[],
  variables: Record<string, number>,
  availableBlocks: BlockType[] = []
): KeypadGroup[] {
  const variableNames = Object.keys(variables);

  const digits: KeypadToken[] = [];
  const operators: KeypadToken[] = [];
  const parens: KeypadToken[] = [];
  const functions: KeypadToken[] = [];
  const constants: KeypadToken[] = [];
  const vars: KeypadToken[] = [];

  const OPERATOR_DISPLAY: Record<string, string> = {
    "*": "×", "/": "÷", "^": "^", "+": "+", "-": "−", "=": "=",
  };
  const FUNCTION_TOKENS = ["sin", "cos", "tan", "sqrt"];
  const CONSTANT_TOKENS = ["pi", "e"];

  for (const token of allowedTokens) {
    if (/^\d$/.test(token) || token === ".") {
      digits.push({ value: token, display: token, type: "digit" });
    } else if (["+", "-", "*", "/", "^", "="].includes(token)) {
      const type: TokenType = token === "=" ? "equals" : "operator";
      operators.push({ value: token, display: OPERATOR_DISPLAY[token] ?? token, type });
    } else if (token === "(" || token === ")" || token === "|") {
      parens.push({ value: token, display: token, type: "paren" });
    } else if (FUNCTION_TOKENS.includes(token)) {
      functions.push({ value: token, display: token, type: "function" });
    } else if (CONSTANT_TOKENS.includes(token)) {
      constants.push({ value: token, display: token === "pi" ? "π" : token, type: "constant" });
    } else if (variableNames.includes(token)) {
      vars.push({ value: token, display: token, type: "variable" });
    } else {
      operators.push({ value: token, display: token, type: "operator" });
    }
  }

  const groups: KeypadGroup[] = [];

  if (digits.length > 0) {
    const order = ["7","8","9","4","5","6","1","2","3","0","."];
    const sorted = order
      .filter((d) => digits.some((t) => t.value === d))
      .map((d) => digits.find((t) => t.value === d)!);
    groups.push({ id: "numbers", label: "숫자", tokens: sorted });
  }
  if (operators.length > 0) groups.push({ id: "operators", label: "연산자", tokens: operators });
  if (parens.length > 0) groups.push({ id: "parens", label: "괄호", tokens: parens });
  if (functions.length > 0) groups.push({ id: "functions", label: "함수", tokens: functions });
  if (constants.length > 0) groups.push({ id: "constants", label: "상수", tokens: constants });
  if (vars.length > 0) groups.push({ id: "variables", label: "변수", tokens: vars });

  if (availableBlocks.length > 0) {
    const blockTokens = availableBlocks.map((bt) => BLOCK_KEYPAD_TOKENS[bt]);
    groups.push({ id: "blocks", label: "블록", tokens: blockTokens });
  }

  return groups;
}

// ─── String → InputCell[] fallback ───────────────────────────────────────────

const MULTI_CHAR_TOKENS: { value: string; type: TokenType }[] = [
  { value: "sin", type: "function" },
  { value: "cos", type: "function" },
  { value: "tan", type: "function" },
  { value: "sqrt", type: "function" },
  { value: "pi", type: "constant" },
];

const DISPLAY_MAP: Record<string, string> = { "*": "×", "/": "÷", "pi": "π" };
const TYPE_MAP: Record<string, TokenType> = {
  "+": "operator", "-": "operator", "*": "operator", "/": "operator", "^": "operator",
  "=": "equals",
  "(": "paren", ")": "paren", "|": "paren",
  ".": "digit",
  "x": "variable", "i": "variable",
  "e": "constant",
};

function answerStringToCells(answer: string): InputCell[] {
  const cells: InputCell[] = [];
  let i = 0;
  while (i < answer.length) {
    const multi = MULTI_CHAR_TOKENS.find((m) => answer.startsWith(m.value, i));
    if (multi) {
      cells.push({
        value: multi.value,
        display: DISPLAY_MAP[multi.value] ?? multi.value,
        type: multi.type,
      });
      i += multi.value.length;
      continue;
    }
    const ch = answer[i];
    const type: TokenType = TYPE_MAP[ch] ?? (/\d/.test(ch) ? "digit" : "operator");
    cells.push({ value: ch, display: DISPLAY_MAP[ch] ?? ch, type });
    i++;
  }
  return cells;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export function adaptPuzzle(transport: PuzzleTransport): PuzzleViewModel {
  const payload = transport.raw_payload as MockPuzzlePayload;

  const variables = payload.variables ?? {};
  const allowedTokens = payload.allowedTokens ?? [];
  const availableBlocks: BlockType[] = (payload as Record<string, unknown>)["availableBlocks"] as BlockType[] ?? [];
  const maxAttempts = payload.maxAttempts ?? 6;
  const tokenLength = transport.token_length ?? (payload.answerCells?.length ?? payload.answer?.length ?? 5);

  const answerCells: InputCell[] =
    payload.answerCells ?? answerStringToCells(payload.answer ?? "");

  const displayPayload = transport.display_payload as
    | { hint?: string; subtitle?: string; context?: Record<string, string | number> }
    | null;

  const contextEntries: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(variables)) contextEntries[k] = v;
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
    availableTokenGroups: buildKeypadGroups(allowedTokens, variables, availableBlocks),
    displayInfo: {
      hint: displayPayload?.hint,
      subtitle: displayPayload?.subtitle,
      context: Object.keys(displayContext).length > 0 ? displayContext : undefined,
    },
    dailyDate: transport.daily_date,
    isDaily: transport.is_daily,
    meta: {
      answerCells,
      answer: payload.answer,
      variables,
      allowedTokens,
      validationStatus: transport.validation_status,
      slug: transport.slug,
    },
  };
}

export function extractValidationContext(vm: PuzzleViewModel) {
  return {
    length: vm.tokenLength,
    allowedTokens: (vm.meta.allowedTokens as string[]) ?? [],
    variables: (vm.meta.variables as Record<string, number>) ?? {},
    answerCells: (vm.meta.answerCells as InputCell[]) ?? [],
  };
}
