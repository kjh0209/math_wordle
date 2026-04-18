import fs from "fs";
import path from "path";
import type { Puzzle, ResultRecord } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const PUZZLES_PATH = path.join(DATA_DIR, "puzzles.json");
const RESULTS_PATH = path.join(DATA_DIR, "results.json");

function ensureResultsFile() {
  if (!fs.existsSync(RESULTS_PATH)) {
    fs.writeFileSync(RESULTS_PATH, "[]", "utf8");
  }
}

export function getPuzzles(): Puzzle[] {
  return JSON.parse(fs.readFileSync(PUZZLES_PATH, "utf8")) as Puzzle[];
}

export function getPuzzleById(id?: string): Puzzle {
  const puzzles = getPuzzles();
  if (!id) return puzzles[0];
  const found = puzzles.find((p) => p.id === id);
  if (!found) throw new Error("퍼즐을 찾을 수 없습니다.");
  return found;
}

export function getResults(): ResultRecord[] {
  ensureResultsFile();
  return JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8")) as ResultRecord[];
}

export function saveResult(record: ResultRecord): ResultRecord {
  const results = getResults();
  results.push(record);
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), "utf8");
  return record;
}

export function getLeaderboard(puzzleId: string) {
  const results = getResults().filter((r) => r.puzzleId === puzzleId && r.cleared);
  const bestBySession = new Map<string, ResultRecord>();

  for (const record of results) {
    const existing = bestBySession.get(record.sessionId);
    if (
      !existing ||
      record.attemptsCount < existing.attemptsCount ||
      (record.attemptsCount === existing.attemptsCount && record.clearTimeMs < existing.clearTimeMs)
    ) {
      bestBySession.set(record.sessionId, record);
    }
  }

  return Array.from(bestBySession.values())
    .sort((a, b) => a.attemptsCount - b.attemptsCount || a.clearTimeMs - b.clearTimeMs)
    .slice(0, 20)
    .map((record, index) => ({
      rank: index + 1,
      sessionId: record.sessionId.slice(0, 8),
      attemptsCount: record.attemptsCount,
      clearTimeMs: record.clearTimeMs,
      createdAt: record.createdAt
    }));
}
