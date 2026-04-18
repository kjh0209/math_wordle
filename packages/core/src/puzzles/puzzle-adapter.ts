/**
 * packages/core — Puzzle adapter (finalized spec)
 *
 * Three-layer mapping:
 *   PuzzleDbRow  →  PuzzleDomainModel  →  PuzzleViewModel
 *
 * Only swap this file when the puzzle engine changes.
 * UI code never reads raw DB rows directly.
 */

import type {
  PuzzleDbRow,
  PuzzleDomainModel,
  PuzzleViewModel,
  PuzzleLevel,
  PuzzleDifficulty,
  PuzzleCategory,
  ReservedBlock,
  KeypadGroup,
  KeypadToken,
  TokenType,
} from "../types/puzzle";
import {
  SPEC_LEVELS,
  SPEC_DIFFICULTIES,
  SPEC_CATEGORIES,
  RESERVED_BLOCKS,
  TOKEN_DEFINITIONS,
  BLOCK_DEFINITIONS,
  DEFAULT_RULES,
  getTokenDisplay,
} from "../types/spec";

// ─── DB Row → Domain Model ────────────────────────────────────────────────────

export function mapPuzzleDbRowToDomain(row: PuzzleDbRow): PuzzleDomainModel {
  const raw = row.raw_payload;

  // Enrich block cells with tokenized cellFields
  const answerCells = raw.answer.cells.map((cell) => {
    if (cell.type === "block") {
      const cellFields: Record<string, import("../types/puzzle").PuzzleCell[]> = {};
      for (const [key, value] of Object.entries(cell.fields)) {
        // Split string into 1-char tokens. For things like "10", it correctly becomes "1", "0"
        // Wait, mathjs tokens might be distinct, e.g. "pi" or "sqrt".
        // Instead of writing a complex tokenizer, we rely on the parser to map fields cleanly.
        // For the static answer in JSON, we can reasonably assume single digit inputs,
        // or we use a basic naive tokenizer for testing, but let's just create token arrays.
        const tokens: import("../types/puzzle").PuzzleCell[] = [];
        let i = 0;
        while (i < value.length) {
          const c = value[i];
          if (/[a-zA-Z]/.test(c)) {
            let funcName = c;
            while (i + 1 < value.length && /[a-zA-Z]/.test(value[i + 1])) {
              funcName += value[++i];
            }
            tokens.push({ type: "token", value: funcName });
          } else {
            tokens.push({ type: "token", value: c });
          }
          i++;
        }
        cellFields[key] = tokens;
      }
      return { ...cell, cellFields };
    }
    return cell;
  });

  return {
    id: row.id,
    title: row.title,
    level: row.level as PuzzleLevel,
    difficulty: row.difficulty as PuzzleDifficulty,
    category: row.category as PuzzleCategory,
    variable: raw.variable ?? null,
    answer: {
      ...raw.answer,
      cells: answerCells,
    },
    rules: {
      requiresVariable: raw.rules.requiresVariable ?? DEFAULT_RULES.requiresVariable,
      allowImplicitMultiplication:
        raw.rules.allowImplicitMultiplication ?? DEFAULT_RULES.allowImplicitMultiplication,
      maxAttempts: raw.rules.maxAttempts ?? DEFAULT_RULES.maxAttempts,
    },
    shownTokens: row.shown_tokens,
    shownBlocks: row.shown_blocks as ReservedBlock[],
    explanation: raw.explanation ?? null,
    isDaily: row.is_daily,
    dailyDate: row.daily_date,
    isPublic: row.is_public,
  };
}

// ─── Domain Model → View Model ────────────────────────────────────────────────

export function mapPuzzleDomainToViewModel(
  domain: PuzzleDomainModel,
  includeAnswer = false
): PuzzleViewModel {
  return {
    id: domain.id,
    title: domain.title,
    level: domain.level,
    difficulty: domain.difficulty,
    category: domain.category,
    variable: domain.variable,
    answerDisplay: domain.answer.display,
    answerLength: domain.answer.length,
    maxAttempts: domain.rules.maxAttempts,
    shownTokens: domain.shownTokens,
    shownBlocks: domain.shownBlocks,
    availableTokenGroups: buildKeypadGroups(domain.shownTokens, domain.shownBlocks),
    explanation: domain.explanation,
    isDaily: domain.isDaily,
    dailyDate: domain.dailyDate,
    meta: {
      // Only included server-side or for offline local use
      answerCells: includeAnswer ? domain.answer.cells : undefined,
      answerExpression: includeAnswer ? domain.answer.expression : undefined,
      variableValue:
        includeAnswer && domain.variable
          ? { [domain.variable.name]: parseFloat(domain.variable.valueExpression) }
          : undefined,
    },
  };
}

/** Convenience: DbRow → ViewModel in one step */
export function adaptPuzzle(
  row: PuzzleDbRow,
  includeAnswer = false
): PuzzleViewModel {
  return mapPuzzleDomainToViewModel(mapPuzzleDbRowToDomain(row), includeAnswer);
}

// ─── Keypad group builder ─────────────────────────────────────────────────────

type TokenCategory = "digit" | "operator" | "paren" | "function" | "constant" | "variable";

const DIGIT_ORDER = ["0","1","2","3","4","5","6","7","8","9","."];

function classifyToken(value: string): TokenCategory {
  const def = TOKEN_DEFINITIONS[value as keyof typeof TOKEN_DEFINITIONS];
  if (!def) return "operator"; // fallback
  switch (def.type) {
    case "digit":
    case "decimal-point":
      return "digit";
    case "operator":
    case "relation":
      return "operator";
    case "grouping":
    case "delimiter":
      return "paren";
    case "function-token":
      return "function";
    case "constant":
      return "constant";
    case "variable":
    case "index-variable":
      return "variable";
    default:
      return "operator";
  }
}

function tokenTypeForKeypad(value: string): TokenType {
  const def = TOKEN_DEFINITIONS[value as keyof typeof TOKEN_DEFINITIONS];
  if (!def) return "operator";
  switch (def.type) {
    case "digit": return "digit";
    case "decimal-point": return "decimal";
    case "operator": return "operator";
    case "relation": return "equals";
    case "grouping":
    case "delimiter": return "paren";
    case "function-token": return "function";
    case "constant": return "constant";
    case "variable":
    case "index-variable": return "variable";
    default: return "operator";
  }
}

export function buildKeypadGroups(
  shownTokens: string[],
  shownBlocks: ReservedBlock[]
): KeypadGroup[] {
  const buckets: Record<TokenCategory, KeypadToken[]> = {
    digit: [],
    operator: [],
    paren: [],
    function: [],
    constant: [],
    variable: [],
  };

  for (const value of shownTokens) {
    const cat = classifyToken(value);
    const display = getTokenDisplay(value);
    buckets[cat].push({ value, display, type: tokenTypeForKeypad(value) });
  }

  // Sort digits in natural order
  if (buckets.digit.length > 0) {
    buckets.digit = DIGIT_ORDER
      .filter((d) => buckets.digit.some((t) => t.value === d))
      .map((d) => buckets.digit.find((t) => t.value === d)!);
  }

  const groups: KeypadGroup[] = [];

  if (buckets.digit.length > 0)
    groups.push({ id: "numbers", label: "숫자", tokens: buckets.digit });
  if (buckets.variable.length > 0)
    groups.push({ id: "variables", label: "변수", tokens: buckets.variable });
  if (buckets.operator.length > 0)
    groups.push({ id: "operators", label: "연산자", tokens: buckets.operator });
  if (buckets.paren.length > 0)
    groups.push({ id: "parens", label: "괄호/구분자", tokens: buckets.paren });
  if (buckets.function.length > 0)
    groups.push({ id: "functions", label: "함수", tokens: buckets.function });
  if (buckets.constant.length > 0)
    groups.push({ id: "constants", label: "상수", tokens: buckets.constant });

  // Block group
  if (shownBlocks.length > 0) {
    const blockTokens: KeypadToken[] = shownBlocks.map((blockType) => {
      const def = BLOCK_DEFINITIONS[blockType];
      return {
        value: blockType,
        display: def.display,
        type: "block" as TokenType,
        blockType,
        blockFieldCount: def.fieldCount,
        blockFieldNames: def.fieldNames,
        width: def.fieldCount > 0 ? "wide" : "normal",
      };
    });
    groups.push({ id: "blocks", label: "블록", tokens: blockTokens });
  }

  return groups;
}

// ─── Problem-set puzzle → ViewModel ──────────────────────────────────────────

export function mapProblemSetPuzzleToViewModel(
  p: import("./problem-sets").ProblemSetPuzzle
): PuzzleViewModel {
  const shownBlocks = (p.shownBlocks ?? []).filter((b): b is ReservedBlock =>
    (["LogBase", "SigmaRange", "IntegralRange", "dx", "d/dx", "Comb", "Perm"] as string[]).includes(b)
  );
  return {
    id: p.id,
    title: p.title,
    level: p.level as PuzzleLevel,
    difficulty: p.difficulty as PuzzleDifficulty,
    category: p.category as PuzzleCategory,
    variable: p.variable
      ? {
          name: p.variable.name,
          valueExpression: p.variable.valueExpression,
          valueDisplay: p.variable.valueDisplay,
        }
      : null,
    answerDisplay: p.answer.display,
    answerLength: p.answer.length,
    maxAttempts: (p.rules as any).maxAttempts ?? 6,
    shownTokens: p.shownTokens,
    shownBlocks,
    availableTokenGroups: buildKeypadGroups(p.shownTokens, shownBlocks),
    explanation: p.explanation ?? null,
    isDaily: false,
    dailyDate: null,
    meta: {
      answerCells: p.answer.cells as import("../types/puzzle").PuzzleCell[],
      answerExpression: p.answer.expression,
    },
  };
}

// ─── Validation context extractor (for server-side use) ───────────────────────

export function extractValidationContext(vm: PuzzleViewModel) {
  return {
    answerCells: vm.meta.answerCells ?? [],
    answerExpression: vm.meta.answerExpression ?? "",
    shownTokens: vm.shownTokens,
    shownBlocks: vm.shownBlocks,
    variableValue: vm.meta.variableValue,
  };
}
