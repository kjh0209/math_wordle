/**
 * packages/core — Finalized puzzle spec constants
 * Single source of truth for all allowed values, token definitions,
 * and block definitions. Mirrors mathle-spec.json exactly.
 */

// ─── Levels ───────────────────────────────────────────────────────────────────

export const SPEC_LEVELS = [
  "elementary_arithmetic",
  "elementary_order_of_operations",
  "elementary_fraction_decimal",
  "middle_variable",
  "middle_linear_expression",
  "middle_linear_equation",
  "middle_quadratic_intro",
  "high_quadratic",
  "high_function",
  "high_trigonometry",
  "high_logarithm",
  "high_exponential",
  "advanced_calculus",
] as const;

export type PuzzleLevel = (typeof SPEC_LEVELS)[number];

// ─── Difficulties ─────────────────────────────────────────────────────────────

export const SPEC_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type PuzzleDifficulty = (typeof SPEC_DIFFICULTIES)[number];

// ─── Categories ───────────────────────────────────────────────────────────────

export const SPEC_CATEGORIES = [
  "arithmetic",
  "algebra",
  "quadratic",
  "function",
  "trigonometry",
  "logarithm",
  "exponential",
  "summation",
  "integral",
  "combinatorics",
  "absolute-value",
  "root",
] as const;

export type PuzzleCategory = (typeof SPEC_CATEGORIES)[number];

// ─── Reserved tokens ──────────────────────────────────────────────────────────

export const RESERVED_TOKENS = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  ".",
  "+", "-", "*", "/", "^",
  "=",
  "(", ")", "|",
  "x", "i", "pi", "e",
  "sin", "cos", "tan", "sqrt",
] as const;

export type ReservedToken = (typeof RESERVED_TOKENS)[number];

export interface TokenDefinition {
  display: string;
  type: string;
  description?: string;
}

export const TOKEN_DEFINITIONS: Record<ReservedToken, TokenDefinition> = {
  "0": { display: "0", type: "digit" },
  "1": { display: "1", type: "digit" },
  "2": { display: "2", type: "digit" },
  "3": { display: "3", type: "digit" },
  "4": { display: "4", type: "digit" },
  "5": { display: "5", type: "digit" },
  "6": { display: "6", type: "digit" },
  "7": { display: "7", type: "digit" },
  "8": { display: "8", type: "digit" },
  "9": { display: "9", type: "digit" },
  ".": { display: ".", type: "decimal-point" },
  "+": { display: "+", type: "operator" },
  "-": { display: "-", type: "operator" },
  "*": { display: "×", type: "operator" },
  "/": { display: "÷", type: "operator" },
  "^": { display: "^", type: "operator" },
  "=": { display: "=", type: "relation" },
  "(": { display: "(", type: "grouping" },
  ")": { display: ")", type: "grouping" },
  "|": { display: "|", type: "delimiter", description: "절댓값 기호" },
  "x": { display: "x", type: "variable" },
  "i": { display: "i", type: "index-variable", description: "시그마 인덱스 변수" },
  "pi": { display: "π", type: "constant" },
  "e": { display: "e", type: "constant" },
  "sin": { display: "sin", type: "function-token" },
  "cos": { display: "cos", type: "function-token" },
  "tan": { display: "tan", type: "function-token" },
  "sqrt": { display: "√", type: "function-token" },
};

/** Get the display string for any token value (reserved or single digit) */
export function getTokenDisplay(value: string): string {
  return TOKEN_DEFINITIONS[value as ReservedToken]?.display ?? value;
}

// ─── Reserved blocks ──────────────────────────────────────────────────────────

export const RESERVED_BLOCKS = [
  "LogBase",
  "SigmaRange",
  "IntegralRange",
  "dx",
  "d/dx",
  "Comb",
  "Perm",
] as const;

export type ReservedBlock = (typeof RESERVED_BLOCKS)[number];

export interface BlockDefinition {
  display: string;
  fieldCount: number;
  fieldNames: string[];
  description?: string;
}

export const BLOCK_DEFINITIONS: Record<ReservedBlock, BlockDefinition> = {
  LogBase: {
    display: "log_()",
    fieldCount: 1,
    fieldNames: ["base"],
    description: "밑을 가지는 로그 블록",
  },
  SigmaRange: {
    display: "Σ[ , ]",
    fieldCount: 2,
    fieldNames: ["start", "end"],
    description: "시그마 블록",
  },
  IntegralRange: {
    display: "∫[ , ]",
    fieldCount: 2,
    fieldNames: ["start", "end"],
    description: "정적분 블록",
  },
  dx: {
    display: "dx",
    fieldCount: 0,
    fieldNames: [],
    description: "미분 변수 블록",
  },
  "d/dx": {
    display: "d/dx",
    fieldCount: 0,
    fieldNames: [],
    description: "미분 연산자 블록",
  },
  Comb: {
    display: "C( , )",
    fieldCount: 2,
    fieldNames: ["n", "r"],
    description: "조합 블록",
  },
  Perm: {
    display: "P( , )",
    fieldCount: 2,
    fieldNames: ["n", "r"],
    description: "순열 블록",
  },
};

/** Build the display string for a block given its field values */
export function getBlockDisplay(
  blockType: ReservedBlock,
  fields: Record<string, string>
): string {
  switch (blockType) {
    case "LogBase":
      return `log${fields.base ?? "?"}()`;
    case "SigmaRange":
      return `Σ[${fields.start ?? "?"},${fields.end ?? "?"}]`;
    case "IntegralRange":
      return `∫[${fields.start ?? "?"},${fields.end ?? "?"}]`;
    case "dx":
      return "dx";
    case "d/dx":
      return "d/dx";
    case "Comb":
      return `C(${fields.n ?? "?"},${fields.r ?? "?"})`;
    case "Perm":
      return `P(${fields.n ?? "?"},${fields.r ?? "?"})`;
    default:
      return blockType;
  }
}

// ─── Default rules ────────────────────────────────────────────────────────────

export const DEFAULT_RULES = {
  requiresVariable: false,
  allowImplicitMultiplication: false,
  maxAttempts: 6,
} as const;
