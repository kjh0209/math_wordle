/**
 * lib/puzzles/puzzle-repository.ts
 *
 * Data access layer for puzzles.
 * Abstracts over data source (mock vs. Supabase) so the UI/API
 * layer never cares which backend is active.
 *
 * To switch from mock to Supabase:
 * 1. Set USE_SUPABASE = true (or use env var)
 * 2. Implement the Supabase branches below
 *
 * TODO: Uncomment Supabase branches once DB is provisioned.
 */

import type { PuzzleTransport, PuzzleSummary } from "@/types/puzzle";
import {
  MOCK_PUZZLES,
  getMockPuzzleById,
  getMockDailyPuzzle,
  getMockRandomPuzzle,
} from "./mock-puzzles";

// Toggle: true = real Supabase, false = mock data
const USE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined
  && process.env.NEXT_PUBLIC_SUPABASE_URL !== ""
  && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project.supabase.co";

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getTodaysPuzzle(): Promise<PuzzleTransport | null> {
  if (USE_SUPABASE) {
    // TODO: Replace with Supabase query:
    // const { data } = await supabase
    //   .from("puzzles")
    //   .select("*")
    //   .eq("is_daily", true)
    //   .eq("daily_date", today)
    //   .eq("validation_status", "published")
    //   .single();
    // return data;
    return getMockDailyPuzzle();
  }
  return getMockDailyPuzzle();
}

export async function getPuzzleById(id: string): Promise<PuzzleTransport | null> {
  if (USE_SUPABASE) {
    // TODO: Replace with Supabase query:
    // const { data } = await supabase.from("puzzles").select("*").eq("id", id).single();
    // return data;
    return getMockPuzzleById(id);
  }
  return getMockPuzzleById(id);
}

export async function getRandomPuzzle(): Promise<PuzzleTransport | null> {
  if (USE_SUPABASE) {
    // TODO: Replace with Supabase query (random row):
    // const { data } = await supabase
    //   .from("puzzles")
    //   .select("*")
    //   .eq("is_public", true)
    //   .eq("validation_status", "published")
    //   .limit(1)
    //   .order("random()");
    // return data?.[0] ?? null;
    return getMockRandomPuzzle();
  }
  return getMockRandomPuzzle();
}

export async function getAllPublishedPuzzles(): Promise<PuzzleSummary[]> {
  if (USE_SUPABASE) {
    // TODO: Supabase implementation
    return MOCK_PUZZLES.map(toSummary);
  }
  return MOCK_PUZZLES.map(toSummary);
}

// Admin: all puzzles regardless of status
export async function adminGetAllPuzzles(): Promise<PuzzleSummary[]> {
  if (USE_SUPABASE) {
    // TODO: Use service role client
    return MOCK_PUZZLES.map(toSummary);
  }
  return MOCK_PUZZLES.map(toSummary);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSummary(p: PuzzleTransport): PuzzleSummary {
  return {
    id: p.id,
    title: p.title,
    type: p.type,
    difficulty: p.difficulty,
    category: p.category,
    validation_status: p.validation_status,
    is_daily: p.is_daily,
    daily_date: p.daily_date,
    is_public: p.is_public,
    quality_score: p.quality_score,
    created_at: p.created_at,
  };
}
