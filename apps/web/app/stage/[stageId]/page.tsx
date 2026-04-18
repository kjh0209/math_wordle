"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Circle,
  Crown,
  ChevronRight,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { GetStageDetailResponse } from "@/types/api";
import type { StageStep, UserStepProgress } from "@mathdle/core";

export default function StageDetailPage() {
  const { stageId } = useParams<{ stageId: string }>();
  const router = useRouter();
  const [data, setData] = useState<GetStageDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/stages/${stageId}`)
      .then((r) => r.json())
      .then((d: GetStageDetailResponse) => setData(d))
      .catch(() => setError("스테이지를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [stageId]);

  if (loading) return <PageShell><LoadingState message="스테이지 불러오는 중..." className="flex-1" /></PageShell>;
  if (error || !data) return <PageShell><ErrorState message={error ?? "오류"} className="flex-1" /></PageShell>;

  const { stage, stepProgress } = data;
  const stageWithSteps = stage as typeof stage & { steps: StageStep[] };
  const steps: StageStep[] = stageWithSteps.steps ?? [];

  const clearedCount = stepProgress.filter((p) => p.cleared).length;
  const progressPct = steps.length > 0 ? Math.round((clearedCount / steps.length) * 100) : 0;

  return (
    <PageShell>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-game-text-muted hover:text-game-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          스테이지 맵
        </Link>

        {/* Stage header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-brand font-semibold uppercase tracking-widest mb-1">
                Stage {stage.stageNumber}
              </p>
              <h1 className="text-2xl font-bold text-game-text">{stage.title}</h1>
              {stage.theme && (
                <p className="text-sm text-game-muted mt-1 capitalize">{stage.theme}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-black text-brand">{progressPct}%</p>
              <p className="text-xs text-game-muted">{clearedCount}/{steps.length} 클리어</p>
            </div>
          </div>

          {stage.description && (
            <p className="text-sm text-game-text-muted leading-relaxed mb-4">
              {stage.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="h-2 bg-game-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <div className="flex flex-col gap-3">
          {steps.map((step, idx) => {
            const progress = stepProgress.find((p) => p.stageStepId === step.id) ?? null;
            // First step always unlocked; others unlocked if prev cleared
            const prevProgress = idx > 0
              ? stepProgress.find((p) => p.stageStepId === steps[idx - 1].id) ?? null
              : null;
            const unlocked = idx === 0 || prevProgress?.cleared === true || progress?.unlocked === true;

            return (
              <StepCard
                key={step.id}
                step={step}
                progress={progress}
                unlocked={unlocked}
                stepNumber={step.stepNumber}
              />
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-game-bg text-game-text">
      <AppHeader />
      {children}
    </div>
  );
}

function StepCard({
  step,
  progress,
  unlocked,
  stepNumber,
}: {
  step: StageStep;
  progress: UserStepProgress | null;
  unlocked: boolean;
  stepNumber: number;
}) {
  const cleared = progress?.cleared ?? false;
  const isBoss = step.isBoss;

  return (
    <Link
      href={unlocked ? `/step/${step.code}` : "#"}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
        isBoss && unlocked
          ? "border-amber-500/50 bg-amber-900/10 hover:bg-amber-900/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]"
          : unlocked
          ? "border-game-border bg-game-card hover:border-brand/40 hover:bg-brand/5"
          : "border-game-border bg-game-bg opacity-50 cursor-not-allowed"
      )}
    >
      {/* Step icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        cleared
          ? "bg-green-900/30 border border-green-700/50"
          : isBoss
          ? "bg-amber-900/30 border border-amber-600/50"
          : unlocked
          ? "bg-game-bg border border-game-border"
          : "bg-game-bg border border-game-border/50"
      )}>
        {cleared ? (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        ) : !unlocked ? (
          <Lock className="w-4 h-4 text-game-muted" />
        ) : isBoss ? (
          <Crown className="w-5 h-5 text-amber-400" />
        ) : (
          <span className="text-sm font-bold text-game-text-muted">{stepNumber}</span>
        )}
      </div>

      {/* Step info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono text-game-muted">{step.code}</span>
          {isBoss && (
            <span className="text-xs px-1.5 py-0.5 bg-amber-900/40 text-amber-400 border border-amber-700/40 rounded font-semibold">
              BOSS
            </span>
          )}
          {cleared && (
            <span className="text-xs px-1.5 py-0.5 bg-green-900/30 text-green-400 border border-green-700/30 rounded">
              클리어
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-game-text truncate">{step.title}</p>
        {step.description && (
          <p className="text-xs text-game-muted mt-0.5 truncate">{step.description}</p>
        )}
        {progress && (
          <p className="text-xs text-game-text-muted mt-1">
            {progress.clearsCount > 0 && `${progress.clearsCount}회 클리어 · `}
            {progress.bestAttemptsCount != null && `최소 ${progress.bestAttemptsCount}회`}
          </p>
        )}
      </div>

      {/* Difficulty badge */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {step.difficulty && (
          <DiffBadge difficulty={step.difficulty} />
        )}
        {unlocked && !cleared && (
          <ChevronRight className="w-4 h-4 text-game-muted" />
        )}
      </div>
    </Link>
  );
}

function DiffBadge({ difficulty }: { difficulty: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    easy: { label: "쉬움", cls: "bg-emerald-900/30 text-emerald-400 border-emerald-700/40" },
    medium: { label: "보통", cls: "bg-yellow-900/30 text-yellow-400 border-yellow-700/40" },
    hard: { label: "어려움", cls: "bg-red-900/30 text-red-400 border-red-700/40" },
  };
  const c = cfg[difficulty] ?? { label: difficulty, cls: "bg-game-card text-game-muted border-game-border" };
  return (
    <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium", c.cls)}>
      {c.label}
    </span>
  );
}
