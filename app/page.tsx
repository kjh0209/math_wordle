"use client";

import { useEffect, useMemo, useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { Keypad } from "@/components/Keypad";
import { Leaderboard } from "@/components/Leaderboard";
import { colorPriority } from "@/lib/game";
import type { FeedbackColor } from "@/lib/types";

type PuzzleResponse = {
  id: string;
  length: number;
  variables: Record<string, number>;
  allowedTokens: string[];
  maxAttempts: number;
  difficulty: string;
};

type SubmitResponse = {
  ok: boolean;
  message?: string;
  solved?: boolean;
  colors?: FeedbackColor[];
  shareText?: string;
  gameOver?: boolean;
};

type Attempt = { guess: string; colors: FeedbackColor[] };

type LeaderboardResponse = {
  puzzleId: string;
  items: { rank: number; sessionId: string; attemptsCount: number; clearTimeMs: number }[];
};

const SESSION_KEY = "mathle-session-id";

function getSessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

export default function HomePage() {
  const [puzzle, setPuzzle] = useState<PuzzleResponse | null>(null);
  const [currentInput, setCurrentInput] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [solved, setSolved] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shareText, setShareText] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse["items"]>([]);
  const [startTimeMs] = useState(Date.now());

  useEffect(() => {
    void fetchPuzzle();
  }, []);

  async function fetchPuzzle() {
    const res = await fetch("/api/puzzle");
    const data = (await res.json()) as PuzzleResponse;
    setPuzzle(data);
    await fetchLeaderboard(data.id);
  }

  async function fetchLeaderboard(puzzleId: string) {
    const res = await fetch(`/api/leaderboard?puzzleId=${puzzleId}`);
    const data = (await res.json()) as LeaderboardResponse;
    setLeaderboard(data.items ?? []);
  }

  const keyboardState = useMemo(() => {
    const state: Record<string, FeedbackColor> = {};
    for (const attempt of attempts) {
      attempt.guess.split("").forEach((ch, idx) => {
        const next = attempt.colors[idx];
        const current = state[ch];
        if (!current || colorPriority(next) > colorPriority(current)) {
          state[ch] = next;
        }
      });
    }
    return state;
  }, [attempts]);

  function handleKeyPress(key: string) {
    if (!puzzle || gameOver) return;
    if (currentInput.length >= puzzle.length) return;
    setError("");
    setCurrentInput((prev) => prev + key);
  }

  function handleDelete() {
    if (gameOver) return;
    setError("");
    setCurrentInput((prev) => prev.slice(0, -1));
  }

  async function handleSubmit() {
    if (!puzzle || gameOver) return;
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          guess: currentInput,
          sessionId: getSessionId(),
          attemptsCount: attempts.length + 1,
          startTimeMs
        })
      });

      const data = (await res.json()) as SubmitResponse;
      if (!res.ok || !data.ok || !data.colors) {
        setError(data.message ?? "제출에 실패했습니다.");
        return;
      }

      setAttempts((prev) => [...prev, { guess: currentInput, colors: data.colors! }]);
      setShareText(data.shareText ?? "");
      setSolved(Boolean(data.solved));
      setGameOver(Boolean(data.gameOver));
      setCurrentInput("");

      if (data.gameOver) {
        await fetchLeaderboard(puzzle.id);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyShareText() {
    if (!shareText) return;
    await navigator.clipboard.writeText(shareText);
    alert("결과가 클립보드에 복사되었습니다.");
  }

  if (!puzzle) return <main className="page">로딩 중...</main>;

  const variableText = Object.entries(puzzle.variables).map(([k, v]) => `${k} = ${v}`).join(", ");

  return (
    <main className="page">
      <div className="header">
        <div>
          <h1>Mathle</h1>
          <p className="subtitle">수학 문제를 푸는 게임이 아니라, 수식을 구성하고 검증하는 게임</p>
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <div className="meta">
            <div className="badge">문제 ID: {puzzle.id}</div>
            <div className="badge">난이도: {puzzle.difficulty}</div>
            <div className="badge">변수: {variableText || "없음"}</div>
            <div className="badge">최대 시도: {puzzle.maxAttempts}</div>
          </div>

          <GameBoard
            length={puzzle.length}
            maxAttempts={puzzle.maxAttempts}
            attempts={attempts}
            currentInput={currentInput}
          />

          <div className="current">
            현재 입력: <strong>{currentInput || "(비어 있음)"}</strong>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <Keypad
            keys={puzzle.allowedTokens}
            keyboardState={keyboardState}
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            disabled={isLoading || gameOver}
          />

          {gameOver ? (
            <div className="actions">
              <div className="badge">{solved ? "정답을 맞혔습니다!" : "게임 오버"}</div>
              <button className="btn secondary" onClick={() => window.location.reload()}>
                다시 시작
              </button>
            </div>
          ) : null}
        </section>

        <aside className="card sidebar">
          <h2>공유</h2>
          <p className="small">게임 종료 후 결과 문자열을 복사할 수 있습니다.</p>
          <div className="sharebox">{shareText || "아직 공유할 결과가 없습니다."}</div>
          <div className="actions">
            <button className="btn primary" onClick={copyShareText} disabled={!shareText}>
              결과 복사
            </button>
          </div>

          <h2 style={{ marginTop: 28 }}>리더보드</h2>
          <p className="small">시도 횟수 우선, 동률이면 시간 순입니다.</p>
          <Leaderboard items={leaderboard} />
        </aside>
      </div>
    </main>
  );
}
