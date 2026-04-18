import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Globe } from "lucide-react";
import { getPuzzleById } from "@/lib/puzzles/puzzle-repository";
import { adaptPuzzle } from "@/lib/puzzles/puzzle-adapter";
import { PuzzleStatusBadge } from "@/components/ui/PuzzleStatusBadge";
import { ValidationErrorList } from "@/components/admin/ValidationErrorList";

interface Props {
  params: { id: string };
}

export default async function AdminPuzzleDetailPage({ params }: Props) {
  const transport = await getPuzzleById(params.id);
  if (!transport) notFound();

  const vm = adaptPuzzle(transport);

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href="/admin/puzzles"
        className="inline-flex items-center gap-1.5 text-sm text-game-text-muted hover:text-game-text mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        퍼즐 목록으로
      </Link>

      {/* Header */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-game-text">{vm.title}</h1>
            <p className="text-sm text-game-text-muted mt-0.5">
              ID: <code className="font-mono text-xs bg-game-card px-1.5 py-0.5 rounded">{transport.id}</code>
            </p>
          </div>
          <PuzzleStatusBadge
            status={transport.validation_status}
            difficulty={transport.difficulty}
          />
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <MetaRow label="타입" value={transport.type} />
          <MetaRow label="카테고리" value={transport.category ?? "-"} />
          <MetaRow label="토큰 길이" value={String(transport.token_length ?? "-")} />
          <MetaRow
            label="품질 점수"
            value={
              transport.quality_score != null
                ? `${(transport.quality_score * 100).toFixed(0)}%`
                : "-"
            }
          />
          <MetaRow label="생성 방법" value={transport.generator_type ?? "manual"} />
          <MetaRow label="생성 모델" value={transport.generator_model ?? "-"} />
        </div>
      </div>

      {/* Daily scheduling */}
      <div className="glass-card p-5 mb-4">
        <h2 className="text-sm font-semibold text-game-text mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand" />
          데일리 퍼즐
        </h2>
        {transport.is_daily ? (
          <p className="text-sm text-green-400">
            {transport.daily_date} 데일리 퍼즐로 게시됨
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-game-text-muted">아직 데일리로 설정되지 않음</p>
            {/* TODO: Wire up publish-daily form action */}
            <button className="px-3 py-1.5 rounded-lg bg-brand/20 text-brand text-xs font-medium hover:bg-brand/30 transition-colors border border-brand/30">
              데일리로 게시
            </button>
          </div>
        )}
      </div>

      {/* Public status */}
      <div className="glass-card p-5 mb-4">
        <h2 className="text-sm font-semibold text-game-text mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand" />
          공개 상태
        </h2>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm ${transport.is_public ? "text-green-400" : "text-game-text-muted"}`}
          >
            {transport.is_public ? "공개됨" : "비공개"}
          </span>
          {/* TODO: Wire up toggle action */}
          <button className="px-3 py-1.5 rounded-lg bg-game-card text-game-text-muted text-xs hover:bg-game-border transition-colors border border-game-border">
            {transport.is_public ? "비공개로 변경" : "공개로 변경"}
          </button>
        </div>
      </div>

      {/* Explanation */}
      {transport.explanation && (
        <div className="glass-card p-5 mb-4">
          <h2 className="text-sm font-semibold text-game-text mb-2">해설</h2>
          <p className="text-sm text-game-text-muted">{transport.explanation}</p>
        </div>
      )}

      {/* Validation errors */}
      <ValidationErrorList errors={transport.validation_errors} className="mb-4" />

      {/* Raw payload */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-game-text mb-3">
          Raw Payload
          <span className="ml-2 text-xs font-normal text-game-muted">
            (TODO: 최종 스키마 확정 후 구조화된 에디터로 교체)
          </span>
        </h2>
        <pre className="text-xs text-game-text-muted bg-game-bg rounded-xl p-4 overflow-x-auto leading-relaxed">
          {JSON.stringify(transport.raw_payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-game-muted">{label}</p>
      <p className="text-sm text-game-text font-medium">{value}</p>
    </div>
  );
}
