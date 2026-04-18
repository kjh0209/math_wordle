/**
 * lib/game/parser.ts
 *
 * Converts a flat InputCell[] (user's guess row) into an AST.
 *
 * Two-phase design:
 *   1. parse()    — structural parsing, throws ParseError on bad syntax
 *   2. evalAST()  — numeric evaluation, throws EvalError when equation doesn't balance
 *
 * Callers distinguish the two failure kinds via ParseResult.errorKind:
 *   "syntax" → malformed expression (wrong token order, unmatched parens, etc.)
 *   "eval"   → valid expression but left ≠ right
 */

import type { TokenUnit, BlockCell, BlockType, InputCell } from "@/types/puzzle";

// ─── AST ──────────────────────────────────────────────────────────────────────

export type ASTNode =
  | { kind: "number"; value: number }
  | { kind: "variable"; name: string }
  | { kind: "constant"; name: "pi" | "e" }
  | { kind: "binop"; op: string; left: ASTNode; right: ASTNode }
  | { kind: "unary_minus"; operand: ASTNode }
  | { kind: "function"; name: "sin" | "cos" | "tan" | "sqrt"; arg: ASTNode }
  | { kind: "abs"; expr: ASTNode }
  | { kind: "logbase"; base: ASTNode; arg: ASTNode }
  | { kind: "sigma"; start: ASTNode; end: ASTNode; body: ASTNode }
  | { kind: "integral"; start: ASTNode; end: ASTNode; body: ASTNode }
  | { kind: "comb"; n: ASTNode; r: ASTNode }
  | { kind: "perm"; n: ASTNode; r: ASTNode }
  | { kind: "equation"; left: ASTNode; right: ASTNode };

// ─── Parse result ─────────────────────────────────────────────────────────────

export type ParseResult =
  | { ok: true; ast: ASTNode }
  | { ok: false; errorKind: "syntax" | "eval"; message: string };

// ─── Internal error classes ───────────────────────────────────────────────────

class ParseError extends Error {}
class EvalError extends Error {}

// ─── Parser ───────────────────────────────────────────────────────────────────

class Parser {
  private cells: InputCell[];
  private pos = 0;

  constructor(cells: InputCell[]) {
    this.cells = cells;
  }

  private peek(): InputCell | undefined {
    return this.cells[this.pos];
  }

  private advance(): InputCell {
    const cell = this.cells[this.pos];
    if (cell === undefined) throw new ParseError("수식이 불완전합니다.");
    this.pos++;
    return cell;
  }

  private isToken(value: string): boolean {
    const c = this.peek();
    return c !== undefined && c.type !== "block" && (c as TokenUnit).value === value;
  }

  private isTokenType(type: string): boolean {
    const c = this.peek();
    return c !== undefined && c.type !== "block" && (c as TokenUnit).type === type;
  }

  private isBlockOf(blockType: BlockType): boolean {
    const c = this.peek();
    return c !== undefined && c.type === "block" && (c as BlockCell).blockType === blockType;
  }

  private expectToken(value: string): void {
    const c = this.advance();
    if (c.type === "block" || (c as TokenUnit).value !== value) {
      throw new ParseError(`'${value}'이(가) 필요합니다.`);
    }
  }

  // ── Top-level: must be a single equation (left = right) ──────────────────

  parse(): ASTNode {
    const equalsCount = this.cells.filter(
      (c) => c.type !== "block" && (c as TokenUnit).value === "="
    ).length;
    if (equalsCount === 0) throw new ParseError("등호(=)가 없습니다.");
    if (equalsCount > 1) throw new ParseError("등호(=)는 정확히 1개여야 합니다.");

    const left = this.parseAdditive();
    this.expectToken("=");
    const right = this.parseAdditive();

    if (this.pos < this.cells.length) {
      throw new ParseError("등호(=) 뒤에 예상치 못한 입력이 있습니다.");
    }

    return { kind: "equation", left, right };
  }

  // ── Additive: +, - (left-associative) ────────────────────────────────────

  private parseAdditive(): ASTNode {
    let node = this.parseMultiplicative();
    while (this.isToken("+") || this.isToken("-")) {
      const op = (this.advance() as TokenUnit).value;
      const right = this.parseMultiplicative();
      node = { kind: "binop", op, left: node, right };
    }
    return node;
  }

  // ── Multiplicative: *, / (left-associative) ───────────────────────────────

  private parseMultiplicative(): ASTNode {
    let node = this.parseExponent();
    while (this.isToken("*") || this.isToken("/")) {
      const op = (this.advance() as TokenUnit).value;
      const right = this.parseExponent();
      node = { kind: "binop", op, left: node, right };
    }
    return node;
  }

  // ── Exponent: ^ (right-associative) ──────────────────────────────────────

  private parseExponent(): ASTNode {
    const base = this.parseUnary();
    if (this.isToken("^")) {
      this.advance();
      const exp = this.parseExponent();
      return { kind: "binop", op: "^", left: base, right: exp };
    }
    return base;
  }

  // ── Unary minus ───────────────────────────────────────────────────────────

  private parseUnary(): ASTNode {
    if (this.isToken("-")) {
      this.advance();
      const operand = this.parseUnary();
      return { kind: "unary_minus", operand };
    }
    return this.parsePrimary();
  }

  // ── Primary ───────────────────────────────────────────────────────────────

  private parsePrimary(): ASTNode {
    const c = this.peek();
    if (c === undefined) throw new ParseError("수식이 불완전합니다.");

    if (c.type === "block") return this.parseBlock(c as BlockCell);

    const tok = c as TokenUnit;

    // Number: collect consecutive digit / decimal tokens
    if (tok.type === "digit") return this.parseNumber();

    // Grouped expression
    if (tok.value === "(") {
      this.advance();
      const inner = this.parseAdditive();
      this.expectToken(")");
      return inner;
    }

    // Absolute value |expr|
    if (tok.value === "|") {
      this.advance();
      const inner = this.parseAdditive();
      this.expectToken("|");
      return { kind: "abs", expr: inner };
    }

    // Variable: x, i
    if (tok.type === "variable") {
      this.advance();
      return { kind: "variable", name: tok.value };
    }

    // Constants: pi, e
    if (tok.type === "constant") {
      this.advance();
      if (tok.value !== "pi" && tok.value !== "e") {
        throw new ParseError(`알 수 없는 상수: "${tok.value}"`);
      }
      return { kind: "constant", name: tok.value };
    }

    // Function tokens: sin, cos, tan, sqrt
    if (tok.type === "function") {
      this.advance();
      if (!["sin", "cos", "tan", "sqrt"].includes(tok.value)) {
        throw new ParseError(`알 수 없는 함수: "${tok.value}"`);
      }
      this.expectToken("(");
      const arg = this.parseAdditive();
      this.expectToken(")");
      return { kind: "function", name: tok.value as "sin" | "cos" | "tan" | "sqrt", arg };
    }

    throw new ParseError(`예상치 못한 토큰: "${tok.value}"`);
  }

  // Collect digit / decimal tokens into a single number node
  private parseNumber(): ASTNode {
    let s = "";
    while (true) {
      const c = this.peek();
      if (!c || c.type === "block") break;
      const t = c as TokenUnit;
      if (t.type !== "digit") break;
      if (t.value === "." && s.includes(".")) break; // second decimal point → stop
      s += t.value;
      this.advance();
    }
    if (!s) throw new ParseError("숫자를 파싱할 수 없습니다.");
    const value = parseFloat(s);
    if (isNaN(value)) throw new ParseError(`올바르지 않은 숫자: "${s}"`);
    return { kind: "number", value };
  }

  // ── Block dispatch ────────────────────────────────────────────────────────

  private parseBlock(block: BlockCell): ASTNode {
    this.advance(); // consume the block cell

    switch (block.blockType) {
      case "LogBase": {
        const base = parseFieldAsExpr(block.fields["base"] ?? "", "LogBase.base");
        this.expectToken("(");
        const arg = this.parseAdditive();
        this.expectToken(")");
        return { kind: "logbase", base, arg };
      }

      case "SigmaRange": {
        const start = parseFieldAsExpr(block.fields["start"] ?? "", "SigmaRange.start");
        const end = parseFieldAsExpr(block.fields["end"] ?? "", "SigmaRange.end");
        // Body: multiplicative-level so Σ has lower precedence than + at call site
        const body = this.parseMultiplicative();
        return { kind: "sigma", start, end, body };
      }

      case "IntegralRange": {
        const start = parseFieldAsExpr(block.fields["start"] ?? "", "IntegralRange.start");
        const end = parseFieldAsExpr(block.fields["end"] ?? "", "IntegralRange.end");
        const body = this.parseMultiplicative();
        if (!this.isBlockOf("dx")) {
          throw new ParseError("∫ 다음에는 dx 블록이 있어야 합니다.");
        }
        this.advance(); // consume dx
        return { kind: "integral", start, end, body };
      }

      case "Comb": {
        const n = parseFieldAsExpr(block.fields["n"] ?? "", "Comb.n");
        const r = parseFieldAsExpr(block.fields["r"] ?? "", "Comb.r");
        return { kind: "comb", n, r };
      }

      case "Perm": {
        const n = parseFieldAsExpr(block.fields["n"] ?? "", "Perm.n");
        const r = parseFieldAsExpr(block.fields["r"] ?? "", "Perm.r");
        return { kind: "perm", n, r };
      }

      case "dx":
        throw new ParseError("dx는 ∫ 블록 뒤에만 올 수 있습니다.");
    }
  }
}

// ─── Field expression helper ──────────────────────────────────────────────────
// Block fields are simple strings like "2", "10", "n"
// Support: non-negative integer / float literal, or single letter variable

function parseFieldAsExpr(s: string, fieldLabel: string): ASTNode {
  const t = s.trim();
  if (!t) throw new ParseError(`블록 필드 ${fieldLabel}이(가) 비어 있습니다.`);
  const n = Number(t);
  if (!isNaN(n) && isFinite(n)) return { kind: "number", value: n };
  if (/^[a-zA-Z]$/.test(t)) return { kind: "variable", name: t };
  throw new ParseError(`블록 필드 ${fieldLabel}을(를) 파싱할 수 없습니다: "${s}"`);
}

// ─── Main parse entry point ───────────────────────────────────────────────────

export function parseCells(cells: InputCell[]): ParseResult {
  if (cells.length === 0) {
    return { ok: false, errorKind: "syntax", message: "입력이 없습니다." };
  }
  try {
    const ast = new Parser(cells).parse();
    return { ok: true, ast };
  } catch (e) {
    const message = e instanceof ParseError ? e.message : "수식을 파싱할 수 없습니다.";
    return { ok: false, errorKind: "syntax", message };
  }
}

// ─── AST Evaluator ────────────────────────────────────────────────────────────

export function evalAST(node: ASTNode, scope: Record<string, number> = {}): number {
  switch (node.kind) {
    case "number":
      return node.value;

    case "variable": {
      if (!(node.name in scope)) {
        throw new EvalError(`변수 '${node.name}'의 값이 정의되지 않았습니다.`);
      }
      return scope[node.name];
    }

    case "constant":
      return node.name === "pi" ? Math.PI : Math.E;

    case "binop": {
      const l = evalAST(node.left, scope);
      const r = evalAST(node.right, scope);
      switch (node.op) {
        case "+": return l + r;
        case "-": return l - r;
        case "*": return l * r;
        case "/":
          if (r === 0) throw new EvalError("0으로 나눌 수 없습니다.");
          return l / r;
        case "^": return Math.pow(l, r);
        default: throw new EvalError(`알 수 없는 연산자: "${node.op}"`);
      }
    }

    case "unary_minus":
      return -evalAST(node.operand, scope);

    case "function": {
      const arg = evalAST(node.arg, scope);
      switch (node.name) {
        case "sin": return Math.sin(arg);
        case "cos": return Math.cos(arg);
        case "tan": return Math.tan(arg);
        case "sqrt":
          if (arg < 0) throw new EvalError("음수의 제곱근은 실수 범위에서 계산할 수 없습니다.");
          return Math.sqrt(arg);
      }
      break;
    }

    case "abs":
      return Math.abs(evalAST(node.expr, scope));

    case "logbase": {
      const base = evalAST(node.base, scope);
      const arg = evalAST(node.arg, scope);
      if (base <= 0 || base === 1) throw new EvalError("로그의 밑은 양수이고 1이 아니어야 합니다.");
      if (arg <= 0) throw new EvalError("로그의 진수는 양수이어야 합니다.");
      return Math.log(arg) / Math.log(base);
    }

    case "sigma": {
      const start = Math.round(evalAST(node.start, scope));
      const end = Math.round(evalAST(node.end, scope));
      if (end - start > 10_000) throw new EvalError("시그마 범위가 너무 큽니다 (최대 10,000).");
      let sum = 0;
      for (let i = start; i <= end; i++) {
        sum += evalAST(node.body, { ...scope, i });
      }
      return sum;
    }

    case "integral": {
      const a = evalAST(node.start, scope);
      const b = evalAST(node.end, scope);
      // Composite Simpson's rule, n=1000 subintervals
      const n = 1000;
      const h = (b - a) / n;
      let sum = evalAST(node.body, { ...scope, x: a }) + evalAST(node.body, { ...scope, x: b });
      for (let k = 1; k < n; k++) {
        const coeff = k % 2 === 0 ? 2 : 4;
        sum += coeff * evalAST(node.body, { ...scope, x: a + k * h });
      }
      return (h / 3) * sum;
    }

    case "comb": {
      const n = Math.round(evalAST(node.n, scope));
      const r = Math.round(evalAST(node.r, scope));
      if (r < 0 || r > n) throw new EvalError("조합: r은 0 이상 n 이하여야 합니다.");
      return factorial(n) / (factorial(r) * factorial(n - r));
    }

    case "perm": {
      const n = Math.round(evalAST(node.n, scope));
      const r = Math.round(evalAST(node.r, scope));
      if (r < 0 || r > n) throw new EvalError("순열: r은 0 이상 n 이하여야 합니다.");
      return factorial(n) / factorial(n - r);
    }

    case "equation":
      throw new Error("equation 노드는 직접 evalAST로 계산하지 않습니다.");
  }

  throw new EvalError("알 수 없는 AST 노드입니다.");
}

// ─── Equation validation ──────────────────────────────────────────────────────

/**
 * Given a parsed equation AST, evaluate both sides and check equality.
 * Returns { ok: false, errorKind: "eval" } when sides differ.
 */
export function validateEquation(
  ast: ASTNode,
  scope: Record<string, number> = {}
): ParseResult {
  if (ast.kind !== "equation") {
    return { ok: false, errorKind: "syntax", message: "최상위 노드가 등식이 아닙니다." };
  }
  try {
    const lv = evalAST(ast.left, scope);
    const rv = evalAST(ast.right, scope);
    if (!Number.isFinite(lv) || !Number.isFinite(rv)) {
      return { ok: false, errorKind: "eval", message: "계산 결과가 유효하지 않습니다 (무한대 또는 NaN)." };
    }
    if (Math.abs(lv - rv) > 1e-9) {
      return {
        ok: false,
        errorKind: "eval",
        message: `등식이 성립하지 않습니다. (좌변 = ${fmt(lv)}, 우변 = ${fmt(rv)})`,
      };
    }
    return { ok: true, ast };
  } catch (e) {
    const message = e instanceof Error ? e.message : "수식 계산 중 오류가 발생했습니다.";
    return { ok: false, errorKind: "eval", message };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function factorial(n: number): number {
  if (n < 0) throw new EvalError("음수의 팩토리얼은 정의되지 않습니다.");
  if (n > 20) throw new EvalError("팩토리얼 계산 범위를 초과했습니다 (최대 20!).");
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function fmt(n: number): string {
  // Show up to 6 significant digits, no trailing zeros
  return parseFloat(n.toPrecision(6)).toString();
}
