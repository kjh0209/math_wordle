/**
 * packages/core — Cell-based guess validator
 *
 * Validation strategy:
 *   1. Cell count check (always)
 *   2. Block field count check (each block field must have exactly 1 token)
 *   3. Allowed cells check (shownTokens / shownBlocks)
 *   4. Expression equality check — handles implicit multiplication,
 *      d/dx (symbolic derivative), ∫ (numerical integration),
 *      Σ (summation), log_base, Comb, Perm
 *
 * Complex numbers: the spec uses `j` as the imaginary unit (to avoid
 * confusion with sigma's index variable `i`). Internally we convert
 * `j` → `i` when building mathjs expression strings.
 */

import { all, create } from "mathjs";
import type { PuzzleCell, PuzzleDomainModel, ReservedBlock } from "../types/puzzle";
import { cellKey } from "../types/puzzle";
import { BLOCK_DEFINITIONS } from "../types/spec";
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
      // Recursively check cellFields
      if (cell.cellFields) {
        for (const fieldCells of Object.values(cell.cellFields)) {
          const r = validateAllowedCells(fieldCells, shownTokens, shownBlocks);
          if (!r.ok) return r;
        }
      }
    }
  }
  return { ok: true };
}

// ─── Block field count check ──────────────────────────────────────────────────

/**
 * Verify that every block in the guess has exactly 1 token per field slot.
 * Block definitions with fieldCount 0 (dx, d/dx) are skipped.
 * This prevents submitting incomplete or overfilled block fields.
 */
export function validateBlockFields(cells: PuzzleCell[]): ValidationResult {
  for (const cell of cells) {
    if (cell.type !== "block") continue;
    const def = BLOCK_DEFINITIONS[cell.blockType];
    if (!def || def.fieldCount === 0) continue;
    for (const fieldName of def.fieldNames) {
      const fieldCells = cell.cellFields?.[fieldName] ?? [];
      if (fieldCells.length === 0) {
        return {
          ok: false,
          message: `${cell.blockType}의 '${fieldName}' 칸을 채워주세요.`,
        };
      }
      if (fieldCells.length > 1) {
        return {
          ok: false,
          message: `${cell.blockType}의 '${fieldName}' 칸에는 1개의 토큰만 허용됩니다.`,
        };
      }
      // Recursively check nested blocks (e.g., block inside a field)
      const nested = validateBlockFields(fieldCells);
      if (!nested.ok) return nested;
    }
  }
  return { ok: true };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Parse a mathematical value expression using mathjs.
 * Handles "pi/2", "sqrt(2)", plain numbers, etc.
 */
export function parseValueExpr(expr: string): number | null {
  try {
    const v = math.evaluate(expr);
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Insert * where implicit multiplication is implied:
 *   2x → 2*x,  2( → 2*(,  )( → )*(,  )x → )*x
 * Avoids breaking multi-letter function names (sin, cos, log…).
 * Also avoids breaking decimal numbers like 1.5 or .5.
 */
function addImplicitMultiplication(expr: string): string {
  return expr
    // digit followed by letter (not a decimal dot): 2x → 2*x
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")
    // digit followed by (: 2( → 2*(
    .replace(/(\d)(\()/g, "$1*$2")
    // ) followed by (: )( → )*(
    .replace(/\)\(/g, ")*(")
    // ) followed by letter: )x → )*x
    .replace(/\)([a-zA-Z])/g, ")*$1")
    // single-letter variable followed by (: x( → x*(
    // (^|[^a-zA-Z]) avoids breaking function names like sin(, cos( — Hermes-compatible (no lookbehind)
    .replace(/(^|[^a-zA-Z])([a-zA-Z])\(/g, "$1$2*(");
}

/**
 * Convert absolute-value pipe notation to mathjs abs():
 *   |expr| → abs(expr)
 * The spec uses `|` as the absolute-value delimiter (non-nested).
 * mathjs treats `|` as bitwise-OR, which would give wrong results.
 */
function convertAbsolutePipes(expr: string): string {
  // Replace every |...| pair (non-greedy, non-nested) with abs(...)
  return expr.replace(/\|([^|]+)\|/g, "abs($1)");
}

/**
 * Build a mathjs-evaluable string from token/block cells.
 * Returns null if the cells contain a block that requires special
 * top-level handling (d/dx, IntegralRange, SigmaRange, dx).
 *
 * Key conversions:
 *   - `j` token → `i`  (mathjs imaginary unit; spec uses j to avoid sigma-index confusion)
 *   - `pi` token → `pi` (mathjs constant)
 *
 * @param excludeVars  Variable names that should NOT be substituted
 *                     (e.g., "x" when building a d/dx expression, "i" inside sigma).
 */
function buildExpressionString(
  cells: PuzzleCell[],
  variableValue?: Record<string, number>,
  excludeVars: Set<string> = new Set()
): string | null {
  const parts: string[] = [];
  let idx = 0;

  while (idx < cells.length) {
    const cell = cells[idx];

    if (cell.type === "token") {
      const v = cell.value;
      // Imaginary unit: j → i (mathjs uses i for complex numbers)
      if (v === "j") {
        parts.push("i");
        idx++;
        continue;
      }
      if (!excludeVars.has(v) && variableValue && v in variableValue) {
        parts.push(String(variableValue[v]));
      } else if (v === "pi") {
        parts.push("pi");
      } else {
        parts.push(v);
      }
      idx++;
      continue;
    }

    // Block cell
    switch (cell.blockType) {
      case "LogBase": {
        const baseCells = cell.cellFields?.base;
        const baseStr = baseCells
          ? buildExpressionString(baseCells, variableValue, excludeVars)
          : cell.fields.base;
        const base = baseStr || "10";
        idx++;
        // Expect opening paren next; consume it
        if (cells[idx]?.type === "token" && (cells[idx] as { value: string }).value === "(") {
          idx++;
        }
        // Collect argument until matching closing paren
        const argParts: string[] = [];
        let depth = 1;
        while (idx < cells.length && depth > 0) {
          const c = cells[idx];
          if (c.type === "token") {
            if (c.value === "(") {
              depth++;
              argParts.push("(");
            } else if (c.value === ")") {
              depth--;
              if (depth > 0) argParts.push(")");
            } else if (c.value === "j") {
              argParts.push("i");
            } else {
              const cv = c.value;
              if (!excludeVars.has(cv) && variableValue && cv in variableValue) {
                argParts.push(String(variableValue[cv]));
              } else {
                argParts.push(cv);
              }
            }
          } else {
            return null; // Nested block inside log argument — unsupported
          }
          idx++;
        }
        const innerExpr = convertAbsolutePipes(addImplicitMultiplication(argParts.join("")));
        parts.push(`log(${innerExpr}, ${base})`);
        break;
      }

      case "Comb": {
        const nStr = cell.cellFields?.n
          ? buildExpressionString(cell.cellFields.n, variableValue, excludeVars)
          : cell.fields.n;
        const rStr = cell.cellFields?.r
          ? buildExpressionString(cell.cellFields.r, variableValue, excludeVars)
          : cell.fields.r;
        const nVal = safeEval(nStr || "0", variableValue);
        const rVal = safeEval(rStr || "0", variableValue);
        parts.push(String(combination(toNumber(nVal), toNumber(rVal))));
        idx++;
        break;
      }

      case "Perm": {
        const nStr = cell.cellFields?.n
          ? buildExpressionString(cell.cellFields.n, variableValue, excludeVars)
          : cell.fields.n;
        const rStr = cell.cellFields?.r
          ? buildExpressionString(cell.cellFields.r, variableValue, excludeVars)
          : cell.fields.r;
        const nVal = safeEval(nStr || "0", variableValue);
        const rVal = safeEval(rStr || "0", variableValue);
        parts.push(String(permutation(toNumber(nVal), toNumber(rVal))));
        idx++;
        break;
      }

      case "d/dx":
      case "IntegralRange":
      case "SigmaRange":
      case "dx":
        // These require special top-level evaluation; signal the caller
        return null;

      default:
        return null;
    }
  }

  return convertAbsolutePipes(addImplicitMultiplication(parts.join("")));
}

function toNumber(v: any): number {
  if (typeof v === "number") return v;
  return 0;
}

/** Evaluate a mathjs expression string; returns null on failure */
function safeEval(expr: string, scope?: Record<string, number>): any {
  try {
    const v = math.evaluate(expr, (scope || {}) as Record<string, unknown>);
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    // Complex number support (mathjs Complex type)
    if (typeof v === "object" && (v.isComplex === true || (v as any).type === "Complex")) return v;
    // Handle BigNumber, Fraction, and other mathjs numeric wrapper types
    try {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    } catch { /* ignore */ }
    return null;
  } catch {
    return null;
  }
}

/** Check mathjs equality robustly for both numbers and complex */
function mathEquals(leftVal: any, rightVal: any): boolean {
  if (leftVal === null || rightVal === null) return false;
  if (typeof leftVal === "number" && typeof rightVal === "number") {
    return Math.abs(leftVal - rightVal) < 1e-9;
  }
  // Try deepEqual via mathjs (handles Complex vs number cross-comparison)
  try {
    const l = math.round(leftVal, 9);
    const r = math.round(rightVal, 9);
    return (math.deepEqual(l, r) as unknown) as boolean;
  } catch {
    return false;
  }
}

// ─── Special-form evaluators ──────────────────────────────────────────────────

/**
 * d/dx [funcCells] = [rhsCells]
 * Verify that derivative(func, x) == rhs symbolically by sampling x.
 */
function evaluateDerivative(
  funcCells: PuzzleCell[],
  rhsCells: PuzzleCell[],
  variableValue?: Record<string, number>
): ValidationResult {
  const excludeX = new Set(["x"]);

  const funcStr = buildExpressionString(funcCells, variableValue, excludeX);
  const rhsStr = buildExpressionString(rhsCells, variableValue, excludeX);

  if (funcStr === null || rhsStr === null) return { ok: true };

  try {
    const derivNode = math.derivative(funcStr, "x");
    const testPoints = [1, 2, 3, 0.5, -1];

    for (const xVal of testPoints) {
      const scope = { x: xVal };
      const derivVal = derivNode.evaluate(scope) as number;
      const rhsVal = safeEval(rhsStr, scope);
      if (rhsVal === null) continue;
      if (!mathEquals(derivVal, rhsVal)) {
        return { ok: false, message: "수식은 올바르지만 등식이 성립하지 않습니다." };
      }
    }
    return { ok: true };
  } catch {
    return { ok: true }; // Can't compute derivative symbolically — skip
  }
}

/**
 * ∫[start,end] [integrandCells] dx = [rhsCells]
 * Uses Simpson's rule for numerical integration.
 */
function evaluateIntegral(
  integralBlock: Extract<PuzzleCell, { type: "block" }>,
  bodyCells: PuzzleCell[],
  rhsCells: PuzzleCell[],
  variableValue?: Record<string, number>
): ValidationResult {
  const startStr = buildExpressionString(integralBlock.cellFields?.start ?? [], variableValue) || cell_fields_str(integralBlock, "start");
  const endStr = buildExpressionString(integralBlock.cellFields?.end ?? [], variableValue) || cell_fields_str(integralBlock, "end");

  const startVal = safeEval(startStr || "0", variableValue);
  const endVal = safeEval(endStr || "1", variableValue);
  if (startVal === null || endVal === null) return { ok: true };

  const dxIdx = bodyCells.findIndex(
    (c) => c.type === "block" && c.blockType === "dx"
  );
  const integrandCells = dxIdx >= 0 ? bodyCells.slice(0, dxIdx) : bodyCells;

  const excludeX = new Set(["x"]);
  const integrandStr = buildExpressionString(integrandCells, variableValue, excludeX);
  const rhsStr = buildExpressionString(rhsCells, variableValue);

  if (integrandStr === null || rhsStr === null) return { ok: true };

  const rhsVal = safeEval(rhsStr, variableValue);
  if (rhsVal === null) return { ok: true };

  // Simpson's rule
  const N = 1000;
  const h = (toNumber(endVal) - toNumber(startVal)) / N;
  let sum = 0;

  try {
    for (let k = 0; k <= N; k++) {
      const x = toNumber(startVal) + k * h;
      const v = safeEval(integrandStr, { ...(variableValue || {}), x });
      if (v === null) return { ok: false, message: "피적분 함수를 계산할 수 없습니다." };
      const coeff = k === 0 || k === N ? 1 : k % 2 === 1 ? 4 : 2;
      sum += coeff * toNumber(v);
    }
    const integral = (h / 3) * sum;
    return mathEquals(integral, rhsVal)
      ? { ok: true }
      : { ok: false, message: "수식은 올바르지만 등식이 성립하지 않습니다." };
  } catch {
    return { ok: true };
  }
}

function cell_fields_str(block: Extract<PuzzleCell, { type: "block" }>, key: string): string {
  return block.fields?.[key] ?? "";
}

/**
 * Σ[start,end] [summandCells] = [rhsCells]
 * Sums the summand expression for i = start..end (inclusive).
 * The spec uses token `i` as the sigma index variable.
 */
function evaluateSigma(
  sigmaBlock: Extract<PuzzleCell, { type: "block" }>,
  bodyCells: PuzzleCell[],
  rhsCells: PuzzleCell[],
  variableValue?: Record<string, number>
): ValidationResult {
  const startStr = buildExpressionString(sigmaBlock.cellFields?.start ?? [], variableValue) || cell_fields_str(sigmaBlock, "start");
  const endStr = buildExpressionString(sigmaBlock.cellFields?.end ?? [], variableValue) || cell_fields_str(sigmaBlock, "end");

  const startVal = safeEval(startStr || "1", variableValue);
  const endVal = safeEval(endStr || "1", variableValue);
  if (startVal === null || endVal === null) return { ok: true };

  // Sigma index variable is `i` (spec token); exclude from variable substitution
  const excludeI = new Set(["i"]);
  const summandStr = buildExpressionString(bodyCells, variableValue, excludeI);
  const rhsStr = buildExpressionString(rhsCells, variableValue);

  if (summandStr === null || rhsStr === null) return { ok: true };

  const rhsVal = safeEval(rhsStr, variableValue);
  if (rhsVal === null) return { ok: true };

  let sum = 0;
  for (let i = toNumber(startVal); i <= toNumber(endVal); i++) {
    const v = safeEval(summandStr, { ...(variableValue || {}), i });
    if (v === null) return { ok: false, message: "시그마 본문을 계산할 수 없습니다." };
    sum += toNumber(v);
  }

  return mathEquals(sum, rhsVal)
    ? { ok: true }
    : { ok: false, message: "수식은 올바르지만 등식이 성립하지 않습니다." };
}

// ─── Main equality check ──────────────────────────────────────────────────────

/**
 * Extract unbound single-letter variables from an expression string.
 * Excludes mathjs built-ins: pi, e, i (imaginary unit).
 */
function extractUnboundVars(expr: string, boundVars: Set<string>): string[] {
  const matches = expr.match(/[a-zA-Z]+/g) || [];
  // mathjs built-in names that are NOT free variables
  const mathBuiltins = new Set(["sin", "cos", "tan", "log", "sqrt", "pi", "e", "i"]);
  const vars = new Set<string>();
  for (const m of matches) {
    if (!mathBuiltins.has(m) && m.length === 1 && !boundVars.has(m)) {
      vars.add(m);
    }
  }
  return Array.from(vars);
}

export function evaluateCellEquality(
  cells: PuzzleCell[],
  variableValue?: Record<string, number>
): ValidationResult {
  try {
    // Find the = sign
    const eqIdx = cells.findIndex(
      (c) => c.type === "token" && c.value === "="
    );
    if (eqIdx === -1) {
      return { ok: false, message: "등호(=)는 정확히 1개여야 합니다." };
    }

    const lhsCells = cells.slice(0, eqIdx);
    const rhsCells = cells.slice(eqIdx + 1);

    if (lhsCells.length === 0 || rhsCells.length === 0) {
      return { ok: false, message: "좌변과 우변이 모두 필요합니다." };
    }

    const first = lhsCells[0];

    // ── d/dx form ──
    if (first.type === "block" && first.blockType === "d/dx") {
      return evaluateDerivative(lhsCells.slice(1), rhsCells, variableValue);
    }

    // ── ∫ form ──
    if (first.type === "block" && first.blockType === "IntegralRange") {
      return evaluateIntegral(first, lhsCells.slice(1), rhsCells, variableValue);
    }

    // ── Σ form ──
    if (first.type === "block" && first.blockType === "SigmaRange") {
      return evaluateSigma(first, lhsCells.slice(1), rhsCells, variableValue);
    }

    // ── Regular expression ──
    const lhsStr = buildExpressionString(lhsCells, variableValue);
    const rhsStr = buildExpressionString(rhsCells, variableValue);

    if (lhsStr === null || rhsStr === null) {
      return { ok: true }; // Skip — special form embedded in expression
    }

    const boundVarSet = new Set(Object.keys(variableValue ?? {}));
    const unboundVars = extractUnboundVars(lhsStr + rhsStr, boundVarSet);

    if (unboundVars.length > 0) {
      // Equations with free variables (y=2x+1, x^2+3x+2=0, etc.) are valid
      // mathematical expressions — we cannot numerically verify them without
      // knowing which variable is "independent". Accept as syntactically valid.
      return { ok: true };
    }

    // All variables are bound — evaluate both sides numerically
    const leftVal = safeEval(lhsStr, variableValue);
    const rightVal = safeEval(rhsStr, variableValue);

    if (leftVal === null || rightVal === null) {
      console.error("[evaluateCellEquality] eval failed - lhsStr:", lhsStr, "rhsStr:", rhsStr, "varVal:", variableValue);
      return { ok: false, message: "올바르지 않은 수식입니다." };
    }

    return mathEquals(leftVal, rightVal)
      ? { ok: true }
      : { ok: false, message: "수식은 올바르지만 등식이 성립하지 않습니다." };
  } catch {
    return { ok: false, message: "올바르지 않은 수식입니다." };
  }
}

// ─── Legacy buildExpression (kept for backward compat) ───────────────────────

/** @deprecated Use evaluateCellEquality directly. */
export function buildExpression(
  cells: PuzzleCell[],
  variableValue?: Record<string, number>
): string | null {
  return buildExpressionString(cells, variableValue);
}

// ─── Main validate entry point ────────────────────────────────────────────────

/** Validate a player's guess (as cells) against the puzzle domain model */
export function validateGuessCells(
  guessCells: PuzzleCell[],
  puzzle: PuzzleDomainModel
): ValidationResult {
  const checks: ValidationResult[] = [
    validateCellCount(guessCells, puzzle.answer.length),
    validateBlockFields(guessCells),
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
  const val = parseValueExpr(puzzle.variable.valueExpression);
  if (val !== null) {
    return { [puzzle.variable.name]: val };
  }
  return undefined;
}

// ─── Wordle-style cell comparison ─────────────────────────────────────────────

export function compareGuessCells(
  guessCells: PuzzleCell[],
  answerCells: PuzzleCell[]
): import("../types/game").NestedFeedback[] {

  type FlatNode = { path: string; key: string; consumed: boolean };

  /**
   * If a block has no cellFields but has fields strings, synthesize cellFields
   * by splitting each field value into single-char tokens (digits, letters grouped).
   * This makes comparison work even when the answer comes from raw JSON without cellFields.
   */
  function getEffectiveCellFields(cell: Extract<PuzzleCell, { type: "block" }>): Record<string, PuzzleCell[]> | null {
    if (cell.cellFields && Object.keys(cell.cellFields).length > 0) return cell.cellFields;
    if (!cell.fields || Object.keys(cell.fields).length === 0) return null;
    const synth: Record<string, PuzzleCell[]> = {};
    for (const [k, v] of Object.entries(cell.fields)) {
      const tokens: PuzzleCell[] = [];
      let i = 0;
      while (i < v.length) {
        const ch = v[i];
        if (/[a-zA-Z]/.test(ch)) {
          let name = ch;
          while (i + 1 < v.length && /[a-zA-Z]/.test(v[i + 1])) name += v[++i];
          tokens.push({ type: "token", value: name });
        } else {
          tokens.push({ type: "token", value: ch });
        }
        i++;
      }
      synth[k] = tokens;
    }
    return synth;
  }

  function flatten(cells: PuzzleCell[]): FlatNode[] {
    const res: FlatNode[] = [];
    function walk(arr: PuzzleCell[], prefix: string) {
      for (let i = 0; i < arr.length; i++) {
        const c = arr[i];
        const currentPath = `${prefix}[${i}]`;
        res.push({ path: currentPath, key: cellKey(c), consumed: false });
        if (c.type === "block") {
          const fields = getEffectiveCellFields(c);
          if (fields) {
            for (const [k, v] of Object.entries(fields)) {
              walk(v, `${currentPath}.${k}`);
            }
          }
        }
      }
    }
    walk(cells, "root");
    return res;
  }

  const ansNodes = flatten(answerCells);
  const guessNodes = flatten(guessCells).map(n => ({ ...n, color: "absent" as import("../types/game").FeedbackColor }));

  // Pass 1: Correct (exact path AND exact key)
  for (const g of guessNodes) {
    const a = ansNodes.find(n => n.path === g.path);
    if (a && a.key === g.key) {
      g.color = "correct";
      a.consumed = true;
    }
  }

  // Pass 2: Present (key exists somewhere in unconsumed answer nodes)
  for (const g of guessNodes) {
    if (g.color === "correct") continue;
    const a = ansNodes.find(n => !n.consumed && n.key === g.key);
    if (a) {
      g.color = "present";
      a.consumed = true;
    }
  }

  // Reconstruct NestedFeedback tree matching guessCells shape
  function buildFeedback(arr: PuzzleCell[], prefix: string): import("../types/game").NestedFeedback[] {
    return arr.map((c, i) => {
      const currentPath = `${prefix}[${i}]`;
      const flatG = guessNodes.find(n => n.path === currentPath);
      const color = flatG ? flatG.color : "absent";

      const feedback: import("../types/game").NestedFeedback = { color };

      if (c.type === "block") {
        const fields = getEffectiveCellFields(c);
        if (fields && Object.keys(fields).length > 0) {
          feedback.fields = {};
          for (const [k, v] of Object.entries(fields)) {
            feedback.fields[k] = buildFeedback(v, `${currentPath}.${k}`);
          }
        }
      }
      return feedback;
    });
  }

  return buildFeedback(guessCells, "root");
}

/** Returns true if ALL cells (including nested block fields) are "correct" */
export function isFeedbackSolved(feedback: import("../types/game").NestedFeedback[]): boolean {
  return feedback.every(f => {
    if (f.color !== "correct") return false;
    // Block cells: ALL inner field tokens must also be correct.
    // Even if f.fields is missing (e.g., dx / d/dx with no fields), the block
    // color itself being "correct" is sufficient for fieldless blocks.
    if (f.fields && Object.keys(f.fields).length > 0) {
      return Object.values(f.fields).every(fieldFeedback => isFeedbackSolved(fieldFeedback));
    }
    return true;
  });
}

export function colorPriority(color: FeedbackColor): number {
  if (color === "correct") return 3;
  if (color === "present") return 2;
  return 1;
}

// ─── Legacy string-based helpers ──────────────────────────────────────────────

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
