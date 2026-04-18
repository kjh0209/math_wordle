/**
 * lib/puzzles/mock-puzzles.ts
 *
 * Mock puzzle data for development and demo.
 * raw_payload is processed by PuzzleAdapter → PuzzleViewModel.
 *
 * TODO: Replace with Supabase-backed data once the final puzzle schema
 * and generation pipeline are finalized.
 */

import type { PuzzleTransport, InputCell, TokenUnit } from "@/types/puzzle";

export interface MockPuzzlePayload {
  /** Legacy flat string answer — used as fallback if answerCells is absent */
  answer: string;
  /** Structured cell array (the canonical representation) */
  answerCells: InputCell[];
  variables: Record<string, number>;
  allowedTokens: string[];
  maxAttempts: number;
}

// ─── Cell builder helpers ────────────────────────────────────────────────────

function d(v: string): TokenUnit { return { value: v, display: v, type: "digit" }; }
function op(v: string, disp?: string): TokenUnit { return { value: v, display: disp ?? v, type: "operator" }; }
function eq(): TokenUnit { return { value: "=", display: "=", type: "equals" }; }
function paren(v: "(" | ")"): TokenUnit { return { value: v, display: v, type: "paren" }; }
function vari(v: string): TokenUnit { return { value: v, display: v, type: "variable" }; }

const NOW = new Date().toISOString();
const TODAY = new Date().toISOString().split("T")[0];

export const MOCK_PUZZLES: PuzzleTransport[] = [
  {
    id: "daily-001",
    slug: "daily-001",
    type: "equation",
    title: "Mathdle #1",
    raw_payload: {
      answer: "x+2=5",
      answerCells: [vari("x"), op("+"), d("2"), eq(), d("5")],
      variables: { x: 3 },
      allowedTokens: ["0","1","2","3","4","5","6","7","8","9","+","-","*","/","=","(",")",".","x"],
      maxAttempts: 6,
    } satisfies MockPuzzlePayload,
    display_payload: { hint: "변수 x의 값을 찾아서 등식을 완성하세요.", context: { x: "?" } },
    answer_payload: null,
    token_length: 5,
    difficulty: "easy",
    category: "algebra",
    explanation: "x = 3이면 3+2 = 5가 성립합니다.",
    validation_status: "published",
    validation_errors: null,
    generator_type: "manual",
    generator_model: null,
    generation_prompt_version: null,
    quality_score: 0.9,
    is_daily: true,
    daily_date: TODAY,
    is_public: true,
    created_by: "admin",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "daily-002",
    slug: "daily-002",
    type: "equation",
    title: "Mathdle #2",
    raw_payload: {
      answer: "3*4=12",
      answerCells: [d("3"), op("*", "×"), d("4"), eq(), d("1"), d("2")],
      variables: {},
      allowedTokens: ["0","1","2","3","4","5","6","7","8","9","+","-","*","/","="],
      maxAttempts: 6,
    } satisfies MockPuzzlePayload,
    display_payload: { hint: "두 수의 곱셈 결과를 맞혀보세요." },
    answer_payload: null,
    token_length: 6,
    difficulty: "easy",
    category: "arithmetic",
    explanation: "3 × 4 = 12",
    validation_status: "published",
    validation_errors: null,
    generator_type: "manual",
    generator_model: null,
    generation_prompt_version: null,
    quality_score: 0.85,
    is_daily: false,
    daily_date: null,
    is_public: true,
    created_by: "admin",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "daily-003",
    slug: "daily-003",
    type: "equation",
    title: "Mathdle #3",
    raw_payload: {
      answer: "2^3=8",
      answerCells: [d("2"), op("^"), d("3"), eq(), d("8")],
      variables: {},
      allowedTokens: ["0","1","2","3","4","5","6","7","8","9","+","-","*","/","=","^"],
      maxAttempts: 6,
    } satisfies MockPuzzlePayload,
    display_payload: { hint: "거듭제곱을 이용한 등식입니다." },
    answer_payload: null,
    token_length: 5,
    difficulty: "medium",
    category: "exponents",
    explanation: "2³ = 8",
    validation_status: "published",
    validation_errors: null,
    generator_type: "manual",
    generator_model: null,
    generation_prompt_version: null,
    quality_score: 0.88,
    is_daily: false,
    daily_date: null,
    is_public: true,
    created_by: "admin",
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "daily-004",
    slug: "daily-004",
    type: "equation",
    title: "Mathdle #4",
    raw_payload: {
      answer: "(2+3)*4=20",
      answerCells: [paren("("), d("2"), op("+"), d("3"), paren(")"), op("*", "×"), d("4"), eq(), d("2"), d("0")],
      variables: {},
      allowedTokens: ["0","1","2","3","4","5","6","7","8","9","+","-","*","/","=","(",")"],
      maxAttempts: 6,
    } satisfies MockPuzzlePayload,
    display_payload: { hint: "괄호의 우선순위를 생각해보세요." },
    answer_payload: null,
    token_length: 10,
    difficulty: "medium",
    category: "arithmetic",
    explanation: "(2+3) × 4 = 5 × 4 = 20",
    validation_status: "published",
    validation_errors: null,
    generator_type: "manual",
    generator_model: null,
    generation_prompt_version: null,
    quality_score: 0.82,
    is_daily: false,
    daily_date: null,
    is_public: true,
    created_by: "admin",
    created_at: NOW,
    updated_at: NOW,
  },
];

export function getMockPuzzleById(id: string): PuzzleTransport | null {
  return MOCK_PUZZLES.find((p) => p.id === id) ?? null;
}

export function getMockDailyPuzzle(): PuzzleTransport | null {
  return MOCK_PUZZLES.find((p) => p.is_daily) ?? MOCK_PUZZLES[0] ?? null;
}

export function getMockRandomPuzzle(): PuzzleTransport {
  const idx = Math.floor(Math.random() * MOCK_PUZZLES.length);
  return MOCK_PUZZLES[idx];
}
