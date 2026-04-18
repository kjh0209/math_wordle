import { EmptyState } from "@/components/ui/EmptyState";
import { ListOrdered } from "lucide-react";

export const dynamic = "force-dynamic";

// TODO: Fetch real generation jobs from DB once the generation pipeline is integrated
async function getGenerationJobs() {
  return [];
}

export default async function GenerationJobsPage() {
  const jobs = await getGenerationJobs();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-game-text">생성 작업</h1>
        <p className="text-sm text-game-text-muted mt-0.5">
          AI 퍼즐 생성 작업 이력
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<ListOrdered />}
            title="생성 작업 없음"
            description="AI 퍼즐 생성 파이프라인이 연동되면 여기에 작업 이력이 표시됩니다."
            action={
              <div className="text-xs text-game-muted text-center max-w-xs">
                TODO: OpenAI 생성 파이프라인 연동 후
                <br />
                puzzle_generation_jobs 테이블에서 데이터를 불러옵니다.
              </div>
            }
          />
        </div>
      ) : null}
    </div>
  );
}
