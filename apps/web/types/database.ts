/**
 * types/database.ts
 *
 * Supabase database row types — must match the SQL migrations exactly.
 * These are the "raw DB" types before any adapter processing.
 */

export interface DbPuzzle {
  id: string;
  slug: string | null;
  type: string;
  title: string;
  raw_payload: unknown;
  display_payload: unknown | null;
  answer_payload: unknown | null;
  token_length: number | null;
  difficulty: string | null;
  category: string | null;
  explanation: string | null;
  validation_status: string;
  validation_errors: unknown | null;
  generator_type: string | null;
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

export interface DbPuzzleGenerationJob {
  id: string;
  requested_type: string | null;
  requested_category: string | null;
  requested_difficulty: string | null;
  requested_constraints: unknown | null;
  status: "pending" | "success" | "failed";
  model: string | null;
  raw_prompt: string | null;
  raw_response: string | null;
  parsed_payload: unknown | null;
  error_message: string | null;
  created_puzzle_id: string | null;
  requested_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPlaySession {
  id: string;
  session_key: string;
  created_at: string;
  updated_at: string;
}

export interface DbPlayRecord {
  id: string;
  puzzle_id: string;
  play_session_id: string;
  mode: string;
  attempts_count: number;
  max_attempts: number;
  cleared: boolean;
  clear_time_ms: number | null;
  started_at: string;
  completed_at: string | null;
  guess_history: unknown;
  feedback_history: unknown;
  raw_result_payload: unknown | null;
  share_code: string | null;
  created_at: string;
}

export interface DbLeaderboardSnapshot {
  id: string;
  puzzle_id: string;
  date_key: string;
  total_players: number;
  total_clears: number;
  best_time_ms: number | null;
  best_attempts_count: number | null;
  snapshot_payload: unknown;
  created_at: string;
}

// ─── Supabase Database type map (for typed client) ───────────────────────────

export interface Database {
  public: {
    Tables: {
      puzzles: {
        Row: DbPuzzle;
        Insert: Omit<DbPuzzle, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbPuzzle, "id" | "created_at">>;
      };
      puzzle_generation_jobs: {
        Row: DbPuzzleGenerationJob;
        Insert: Omit<DbPuzzleGenerationJob, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbPuzzleGenerationJob, "id" | "created_at">>;
      };
      play_sessions: {
        Row: DbPlaySession;
        Insert: Omit<DbPlaySession, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbPlaySession, "id" | "created_at">>;
      };
      play_records: {
        Row: DbPlayRecord;
        Insert: Omit<DbPlayRecord, "id" | "created_at">;
        Update: Partial<Omit<DbPlayRecord, "id" | "created_at">>;
      };
      leaderboard_snapshots: {
        Row: DbLeaderboardSnapshot;
        Insert: Omit<DbLeaderboardSnapshot, "id" | "created_at">;
        Update: Partial<Omit<DbLeaderboardSnapshot, "id" | "created_at">>;
      };
    };
  };
}
