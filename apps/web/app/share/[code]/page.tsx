import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { ArrowRight, Trophy } from "lucide-react";
import type { Metadata } from "next";

interface SharePageProps {
  params: { code: string };
}

async function getShareData(code: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/share/${code}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json() as {
      found: boolean;
      share: {
        code: string;
        puzzleId: string;
        puzzleTitle: string;
        solved: boolean;
        attemptsUsed: number;
        maxAttempts: number;
        clearTimeMs: number | null;
        emojiGrid: string;
        createdAt: string;
      } | null;
    };
    return data.found ? data.share : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const share = await getShareData(params.code);
  if (!share) return { title: "공유된 퍼즐" };
  const score = share.solved
    ? `${share.attemptsUsed}/${share.maxAttempts}번 만에 성공!`
    : "도전 실패";
  return {
    title: `${share.puzzleTitle} — ${score}`,
    description: `Mathdle 공유 결과: ${share.emojiGrid.replace(/\n/g, " ")}`,
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const share = await getShareData(params.code);

  if (!share) {
    notFound();
  }

  const score = share.solved
    ? `${share.attemptsUsed}/${share.maxAttempts}번 만에 성공!`
    : `${share.maxAttempts}번 모두 실패`;

  const timeSec =
    share.clearTimeMs != null
      ? share.clearTimeMs < 60000
        ? `${(share.clearTimeMs / 1000).toFixed(1)}초`
        : `${Math.floor(share.clearTimeMs / 60000)}분 ${Math.floor((share.clearTimeMs % 60000) / 1000)}초`
      : null;

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Card */}
          <div className="glass-card p-6 text-center mb-4">
            {/* Title */}
            <h1 className="text-xl font-bold text-game-text mb-1">
              {share.puzzleTitle}
            </h1>
            <p className="text-sm text-game-text-muted mb-6">{score}</p>

            {/* Emoji grid */}
            <div className="font-mono text-2xl leading-relaxed tracking-widest mb-6">
              {share.emojiGrid.split("\n").map((row, i) => (
                <div key={i}>{row}</div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 text-sm">
              <div>
                <p className="font-bold text-game-text font-mono-game">
                  {share.attemptsUsed}/{share.maxAttempts}
                </p>
                <p className="text-game-text-muted text-xs">시도</p>
              </div>
              {timeSec && (
                <div>
                  <p className="font-bold text-game-text font-mono-game">{timeSec}</p>
                  <p className="text-game-text-muted text-xs">시간</p>
                </div>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2">
            <Link
              href={`/play/${share.puzzleId}`}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand text-white font-bold hover:bg-brand-600 transition-colors"
            >
              이 퍼즐 풀어보기
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/play"
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-game-card border border-game-border text-game-text-muted hover:text-game-text text-sm transition-colors"
            >
              오늘의 퍼즐 풀기
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center justify-center gap-2 py-2.5 text-sm text-game-text-muted hover:text-game-text transition-colors"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              리더보드 보기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
