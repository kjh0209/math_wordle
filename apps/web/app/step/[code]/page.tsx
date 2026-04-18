"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ArrowLeft, Crown, Shuffle, Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { GetStepIntroResponse } from "@/types/api";

export default function StepIntroPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [data, setData] = useState<GetStepIntroResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/steps/${code}`)
      .then((r) => r.json())
      .then((d: GetStepIntroResponse) => setData(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [code]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-game-bg">
        <AppHeader />
        <LoadingState message="스텝 불러오는 중..." className="flex-1" />
      </div>
    );
  }

  const { step, progress } = data;
  const [stageNum] = code.split("-");
  const isBoss = step.isBoss;
  const cleared = progress?.cleared ?? false;

  return (
    <div className="min-h-screen flex flex-col bg-game-bg text-game-text">
      <AppHeader />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col">
        {/* Back */}
        <Link
          href={`/stage/stage-${stageNum}`}
          className="inline-flex items-center gap-1.5 text-sm text-game-text-muted hover:text-game-text mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          스테이지 {stageNum}
        </Link>

        {/* Boss banner */}
        {isBoss && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-900/20 border border-amber-600/40 mb-6">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-300">보스 스텝</p>
              <p className="text-xs text-amber-500/80">이 스테이지의 마지막 관문입니다</p>
            </div>
          </div>
        )}

        {/* Step card */}
        <div className={cn(
          "glass-card p-6 mb-6 flex-shrink-0",
          isBoss && "border-amber-500/30"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "px-3 py-1 rounded-lg text-sm font-mono font-bold",
              isBoss
                ? "bg-amber-900/30 text-amber-400 border border-amber-600/30"
                : "bg-brand/10 text-brand border border-brand/20"
            )}>
              {step.code}
            </div>
            {cleared && (
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                클리어 완료
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-game-text mb-2">{step.title}</h1>
          {step.description && (
            <p className="text-sm text-game-text-muted leading-relaxed">{step.description}</p>
          )}

          {step.category && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-game-muted">카테고리</span>
              <span className="text-xs px-2 py-0.5 bg-game-bg border border-game-border rounded text-game-text-muted capitalize">
                {step.category}
              </span>
            </div>
          )}
        </div>

        {/* Pool explanation */}
        <div className="glass-card p-5 mb-6">
          <div className="flex items-start gap-3">
            <Shuffle className="w-5 h-5 text-brand mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-game-text mb-1">
                이 스텝에는 5개의 퍼즐 풀이 있습니다
              </p>
              <p className="text-xs text-game-text-muted leading-relaxed">
                시작할 때마다 아직 풀지 않은 퍼즐이 우선 제공됩니다.
                다시 시도하면 다른 퍼즐이 출제될 수 있어요 — 단순히 시도 횟수를 늘리는 게 아니라,
                새로운 관점으로 같은 개념에 도전하는 방식입니다.
              </p>
            </div>
          </div>
        </div>

        {/* Progress summary if any */}
        {progress && (progress.clearsCount > 0 || progress.failuresCount > 0) && (
          <div className="glass-card p-4 mb-6">
            <p className="text-xs text-game-muted mb-3 font-semibold uppercase tracking-wider">내 기록</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="클리어" value={progress.clearsCount} color="text-green-400" />
              <Stat label="실패" value={progress.failuresCount} color="text-red-400" />
              <Stat
                label="최소 시도"
                value={progress.bestAttemptsCount ?? "-"}
                color="text-brand"
              />
            </div>
            {progress.seenPuzzleIds.length > 0 && (
              <p className="text-xs text-game-muted mt-3 text-center">
                {progress.seenPuzzleIds.length}/5 퍼즐 경험
              </p>
            )}
          </div>
        )}

        {/* Start button */}
        <div className="mt-auto space-y-3">
          <Link
            href={`/step/${code}/play`}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-bold transition-colors",
              isBoss
                ? "bg-amber-500 hover:bg-amber-400 text-black"
                : "bg-brand hover:bg-brand/90 text-white"
            )}
          >
            <Play className="w-5 h-5" />
            {cleared ? "다시 도전하기" : "시작하기"}
          </Link>

          <Link
            href={`/stage/stage-${stageNum}`}
            className="flex items-center justify-center w-full py-3 rounded-2xl text-sm text-game-text-muted border border-game-border hover:bg-game-card transition-colors"
          >
            스테이지로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div>
      <p className={cn("text-xl font-bold", color)}>{value}</p>
      <p className="text-xs text-game-muted mt-0.5">{label}</p>
    </div>
  );
}
