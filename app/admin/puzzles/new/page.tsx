"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function NewPuzzlePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsGenerating(true);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const body = {
      type: form.get("type") as string,
      category: form.get("category") as string,
      difficulty: form.get("difficulty") as string,
    };

    try {
      const res = await fetch("/api/admin/generate-puzzle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { jobId?: string; error?: string };
      if (data.jobId) {
        setResult(`생성 작업이 시작되었습니다. Job ID: ${data.jobId}`);
      } else {
        setResult(`오류: ${data.error ?? "알 수 없는 오류"}`);
      }
    } catch {
      setResult("네트워크 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Link
        href="/admin/puzzles"
        className="inline-flex items-center gap-1.5 text-sm text-game-text-muted hover:text-game-text mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        퍼즐 목록으로
      </Link>

      <h1 className="text-xl font-bold text-game-text mb-6">퍼즐 생성</h1>

      {/* AI Generation */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-semibold text-game-text">AI 퍼즐 생성</h2>
          <span className="text-xs bg-yellow-900/40 text-yellow-300 border border-yellow-700 px-2 py-0.5 rounded-full">
            TODO: OpenAI 연동 필요
          </span>
        </div>

        <form onSubmit={(e) => void handleGenerate(e)} className="flex flex-col gap-3">
          <FormField label="타입">
            <select
              name="type"
              className="w-full bg-game-card border border-game-border rounded-xl px-3 py-2 text-sm text-game-text focus:outline-none focus:border-brand"
            >
              <option value="equation">방정식</option>
              <option value="arithmetic">산술</option>
              <option value="algebra">대수</option>
            </select>
          </FormField>

          <FormField label="카테고리">
            <input
              name="category"
              type="text"
              placeholder="예: addition, trigonometry..."
              className="w-full bg-game-card border border-game-border rounded-xl px-3 py-2 text-sm text-game-text placeholder:text-game-muted focus:outline-none focus:border-brand"
            />
          </FormField>

          <FormField label="난이도">
            <select
              name="difficulty"
              className="w-full bg-game-card border border-game-border rounded-xl px-3 py-2 text-sm text-game-text focus:outline-none focus:border-brand"
            >
              <option value="easy">쉬움</option>
              <option value="medium">보통</option>
              <option value="hard">어려움</option>
              <option value="expert">전문가</option>
            </select>
          </FormField>

          <button
            type="submit"
            disabled={isGenerating}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isGenerating
                ? "bg-brand/50 text-white/60 cursor-not-allowed"
                : "bg-brand text-white hover:bg-brand-600"
            )}
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                AI로 생성
              </>
            )}
          </button>
        </form>

        {result && (
          <div
            className={cn(
              "mt-3 p-3 rounded-xl text-sm",
              result.startsWith("오류")
                ? "bg-red-900/20 border border-red-800 text-red-300"
                : "bg-green-900/20 border border-green-800 text-green-300"
            )}
          >
            {result}
          </div>
        )}
      </div>

      {/* Manual creation placeholder */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-game-text mb-2">수동 생성</h2>
        <p className="text-xs text-game-text-muted mb-3">
          TODO: 최종 퍼즐 스키마가 확정되면 여기에 수동 생성 폼을 추가합니다.
          현재는 raw_payload를 JSON으로 직접 입력하는 방식을 지원합니다.
        </p>
        <textarea
          rows={8}
          placeholder='{"answer": "x+2=5", "variables": {"x": 3}, "allowedTokens": ["0","1","2","3","4","5","6","7","8","9","+","-","=","x"], "maxAttempts": 6}'
          className="w-full bg-game-card border border-game-border rounded-xl px-3 py-2 text-xs text-game-text font-mono placeholder:text-game-muted focus:outline-none focus:border-brand resize-none"
        />
        <button
          disabled
          className="mt-2 w-full py-2.5 rounded-xl text-sm font-medium bg-game-card border border-game-border text-game-muted cursor-not-allowed"
        >
          수동 생성 (스키마 확정 후 활성화)
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-game-text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
