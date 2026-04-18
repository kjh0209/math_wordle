/**
 * lib/puzzles/puzzle-repository.ts
 *
 * Data access layer for puzzles.
 * Uses Supabase when configured, falls back to mock data otherwise.
 */

import type { PuzzleDbRow, PuzzleSummary } from "@mathdle/core";
import {
  MOCK_PUZZLES,
  getMockPuzzleById,
  getMockDailyPuzzle,
  getMockRandomPuzzle,
} from "@mathdle/core";
import type { NormalizedPuzzleRow } from "./puzzle-normalizer";

// ── Detect if Supabase is configured ─────────────────────────────────────────

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    typeof url === "string" &&
    url.length > 0 &&
    !url.includes("your-project")
  );
}

// Lazy import so Next.js doesn't try to use Supabase client-side
async function getSupabase() {
  const { createServiceClient } = await import("../supabase/server");
  return createServiceClient();
}

// Untyped client for write operations — we don't have generated DB types
// (Supabase types not generated yet; cast via unknown)
interface DbError { message: string }
interface DbResult<T> { data: T | null; error: DbError | null }

async function getSupabaseAny() {
  const client = await getSupabase();
  return client as unknown as {
    from(table: string): {
      upsert(row: unknown, opts?: unknown): { select(col: string): { single(): Promise<DbResult<unknown>> } };
      update(obj: unknown): { eq(col: string, val: unknown): Promise<{ error: DbError | null }> };
      insert(obj: unknown): { select(col: string): { single(): Promise<DbResult<unknown>> } };
    };
  };
}

// ─── Public read API ──────────────────────────────────────────────────────────

export async function getTodaysPuzzle(): Promise<PuzzleDbRow | null> {
  if (!isSupabaseConfigured()) return getMockDailyPuzzle();

  const supabase = await getSupabase();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("puzzles")
    .select("*")
    .eq("is_daily", true)
    .eq("daily_date", today)
    .eq("is_public", true)
    .single();

  if (error || !data) return getMockDailyPuzzle(); // graceful fallback
  return data as unknown as PuzzleDbRow;
}

export async function getPuzzleById(id: string): Promise<PuzzleDbRow | null> {
  if (!isSupabaseConfigured()) return getMockPuzzleById(id);

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("puzzles")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (error || !data) return getMockPuzzleById(id);
  return data as unknown as PuzzleDbRow;
}

export async function getRandomPuzzle(): Promise<PuzzleDbRow | null> {
  if (!isSupabaseConfigured()) return getMockRandomPuzzle();

  const supabase = await getSupabase();
  // Postgres random() ordered query
  const { data, error } = await supabase
    .from("puzzles")
    .select("*")
    .eq("is_public", true)
    .limit(1)
    .order("created_at", { ascending: false }); // deterministic fallback if random not available

  if (error || !data || data.length === 0) return getMockRandomPuzzle();
  return data[0] as unknown as PuzzleDbRow;
}

export async function getAllPublishedPuzzles(): Promise<PuzzleSummary[]> {
  if (!isSupabaseConfigured()) return MOCK_PUZZLES.map(toSummary);

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("puzzles")
    .select("id,title,level,difficulty,category,is_daily,daily_date,is_public,source_type,has_variable,created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error || !data) return MOCK_PUZZLES.map(toSummary);
  return (data as unknown as SummaryRow[]).map(summaryRowToModel);
}

export async function adminGetAllPuzzles(): Promise<PuzzleSummary[]> {
  if (!isSupabaseConfigured()) return MOCK_PUZZLES.map(toSummary);

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("puzzles")
    .select("id,title,level,difficulty,category,is_daily,daily_date,is_public,source_type,has_variable,created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return MOCK_PUZZLES.map(toSummary);
  return (data as unknown as SummaryRow[]).map(summaryRowToModel);
}

// ─── Write API (used by import / admin routes) ────────────────────────────────

export interface UpsertResult {
  id: string;
  inserted: boolean;
  error: string | null;
}

export async function upsertPuzzle(row: NormalizedPuzzleRow): Promise<UpsertResult> {
  if (!isSupabaseConfigured()) {
    // Mock: just return success
    return { id: row.id, inserted: true, error: null };
  }

  const supabase = await getSupabaseAny();
  const { data, error } = await supabase
    .from("puzzles")
    .upsert(row, { onConflict: "id" })
    .select("id")
    .single();

  if (error) return { id: row.id, inserted: false, error: error.message };
  return { id: (data as { id: string }).id, inserted: true, error: null };
}

export async function upsertManyPuzzles(
  rows: NormalizedPuzzleRow[]
): Promise<UpsertResult[]> {
  return Promise.all(rows.map(upsertPuzzle));
}

export async function publishPuzzleAsDaily(
  puzzleId: string,
  date: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: true };

  const supabase = await getSupabaseAny();
  // Clear any existing daily for that date first
  await supabase.from("puzzles").update({ is_daily: false, daily_date: null }).eq("daily_date", date);

  const { error } = await supabase
    .from("puzzles")
    .update({ is_daily: true, daily_date: date })
    .eq("id", puzzleId);

  return error ? { ok: false, error: error.message } : { ok: true };
}

// ─── Import job tracking ──────────────────────────────────────────────────────

export async function createImportJob(sourceName: string, rawPayload: unknown) {
  if (!isSupabaseConfigured()) return { id: crypto.randomUUID() };

  const supabase = await getSupabaseAny();
  const { data, error } = await supabase
    .from("puzzle_import_jobs")
    .insert({ source_name: sourceName, status: "pending", raw_payload: rawPayload })
    .select("id")
    .single();

  return { id: (data as { id: string } | null)?.id ?? crypto.randomUUID() };
}

export async function finalizeImportJob(
  jobId: string,
  importedCount: number,
  failedCount: number,
  errorLog: unknown
) {
  if (!isSupabaseConfigured()) return;

  const supabase = await getSupabaseAny();
  const status = failedCount === 0 ? "success" : importedCount > 0 ? "success" : "failed";
  await supabase.from("puzzle_import_jobs").update({
    status,
    imported_count: importedCount,
    failed_count: failedCount,
    error_log: errorLog,
  }).eq("id", jobId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Shape of partial Supabase select for summary queries */
interface SummaryRow {
  id: string;
  title: string;
  level: string;
  difficulty: string;
  category: string;
  is_daily: boolean;
  daily_date: string | null;
  is_public: boolean;
  source_type: string;
  has_variable: boolean;
  created_at: string;
}

function summaryRowToModel(row: SummaryRow): PuzzleSummary {
  return {
    id: row.id,
    title: row.title,
    level: row.level,
    difficulty: row.difficulty,
    category: row.category,
    isDaily: row.is_daily,
    dailyDate: row.daily_date,
    isPublic: row.is_public,
    sourceType: row.source_type,
    hasVariable: row.has_variable,
    createdAt: row.created_at,
  };
}

function toSummary(p: PuzzleDbRow): PuzzleSummary {
  return {
    id: p.id,
    title: p.title,
    level: p.level,
    difficulty: p.difficulty,
    category: p.category,
    isDaily: p.is_daily,
    dailyDate: p.daily_date,
    isPublic: p.is_public,
    sourceType: p.source_type,
    hasVariable: p.has_variable,
    createdAt: p.created_at,
  };
}
