/**
 * types/puzzle.ts
 *
 * Puzzle type system with a deliberate separation between:
 * - Transport types: raw data from API/DB (intentionally flexible — final schema TBD)
 * - View model: stable contract that UI components depend on
 *
 * This layering lets the puzzle engine be swapped without touching UI code.
 */

// ─── Transport Layer (raw, from DB/API) ────────────────────────────────────

/**
 * Raw puzzle record as stored in Supabase.
 * raw_payload is intentionally `unknown` because the final puzzle JSON schema
 * is not yet finalized. The PuzzleAdapter converts this into PuzzleViewModel.
 */
export interface PuzzleTransport {
  id: string;
  slug: string | null;
  type: string;
  title: string;
  /** Core puzzle data — schema not yet finalized, kept flexible */
  raw_payload: unknown;
  /** Optional display-only data separate from answer logic */
  display_payload: unknown | null;
  /** Answer verification data — separate from display for security */
  answer_payload: unknown | null;
  token_length: number | null;
  difficulty: string | null;
  category: string | null;
  explanation: string | null;
  validation_status: ValidationStatus;
  validation_errors: unknown | null;
  generator_type: GeneratorType | null;
  generator_model: string | null;
  generation_prompt_version: string | null;
  quality_score: number | null;
  is_daily: boolean;
  daily_date: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ValidationStatus = "draft" | "valid" | "rejected" | "published";
export type GeneratorType = "manual" | "ai";
export type DifficultyLevel = "easy" | "medium" | "hard" | "expert";

// ─── View Model (stable UI contract) ────────────────────────────────────────

/**
 * The normalized view model that UI components consume.
 * This type should remain stable even as raw_payload evolves.
 *
 * TODO: When the final puzzle engine is integrated, the PuzzleAdapter
 * will populate all fields from the finalized raw_payload structure.
 */
export interface PuzzleViewModel {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  category: string | null;
  explanation: string | null;

  /** Number of token slots in the solution (grid width) */
  tokenLength: number;
  /** Maximum allowed attempts */
  maxAttempts: number;

  /** Token groups for the scientific keypad */
  availableTokenGroups: KeypadGroup[];

  /** Display metadata for the puzzle header */
  displayInfo: PuzzleDisplayInfo;

  dailyDate: string | null;
  isDaily: boolean;

  /** Extensible metadata bucket — adapter can put puzzle-specific data here */
  meta: Record<string, unknown>;
}

export interface PuzzleDisplayInfo {
  hint?: string;
  subtitle?: string;
  /** e.g., { x: "3", n: "unknown" } — shown in puzzle header */
  context?: Record<string, string | number>;
}

// ─── Keypad / Token definitions ──────────────────────────────────────────────

export interface KeypadGroup {
  id: string;
  label: string;
  tokens: (KeypadToken | BlockKeypadToken)[];
}

export interface KeypadToken {
  /** Value inserted into input when pressed */
  value: string;
  /** Text shown on the key */
  display: string;
  type: TokenType;
  /** How many "columns" this key occupies in the grid */
  width?: "normal" | "wide";
  disabled?: boolean;
}

export type TokenType =
  | "digit"
  | "operator"
  | "function"
  | "variable"
  | "constant"
  | "paren"
  | "equals"
  | "decimal"
  | "action";

/** A single unit in a guess row */
export interface TokenUnit {
  value: string;
  display: string;
  type: TokenType;
}

// ─── Block / Input Cell types ────────────────────────────────────────────────

export type BlockType =
  | "LogBase"
  | "SigmaRange"
  | "IntegralRange"
  | "dx"
  | "Comb"
  | "Perm";

/** A composite block cell (e.g. log base, sigma range) */
export interface BlockCell {
  type: "block";
  blockType: BlockType;
  /** Equals blockType — satisfies the { value, display } contract used by grid/preview components */
  value: string;
  /** Named sub-expression fields, e.g. { base: "2" } or { start: "1", end: "5" } */
  fields: Record<string, string>;
  display: string;
}

/** Union of all cell types that can appear in a user's guess row */
export type InputCell = TokenUnit | BlockCell;

// ─── Block keypad token ──────────────────────────────────────────────────────

/** A block entry in the keypad — pressing it opens a field-input panel */
export interface BlockKeypadToken {
  type: "block";
  blockType: BlockType;
  display: string;
  /** Human-readable labels for each field, e.g. { base: "밑", start: "시작", end: "끝" } */
  fieldLabels: Record<string, string>;
}

// ─── Admin / Generation ──────────────────────────────────────────────────────

export interface PuzzleSummary {
  id: string;
  title: string;
  type: string;
  difficulty: string | null;
  category: string | null;
  validation_status: ValidationStatus;
  is_daily: boolean;
  daily_date: string | null;
  is_public: boolean;
  quality_score: number | null;
  created_at: string;
}

export interface GenerationJobSummary {
  id: string;
  requested_type: string | null;
  requested_difficulty: string | null;
  status: "pending" | "success" | "failed";
  model: string | null;
  error_message: string | null;
  created_puzzle_id: string | null;
  created_at: string;
}

export interface GenerationRequest {
  type?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  constraints?: Record<string, unknown>;
}
