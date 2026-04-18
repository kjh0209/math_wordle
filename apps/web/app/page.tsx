import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { ArrowRight, BookOpen, Trophy, Sparkles, Hash } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-2xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/20 border border-brand/30 text-brand text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            매일 새로운 수학 퍼즐
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
            Math<span className="text-brand">dle</span>
          </h1>

          <p className="text-lg text-game-text-muted max-w-md mx-auto leading-relaxed">
            Wordle에서 영감을 받은 수학 방정식 퍼즐 게임.
            <br />
            수식을 조합하고 등식을 완성해보세요.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mb-12 animate-fade-in-up">
          <Link
            href="/play"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-brand text-white font-bold text-base hover:bg-brand-600 transition-colors shadow-lg shadow-brand/25"
          >
            오늘의 퍼즐 풀기
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/play?mode=practice"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-game-card border border-game-border text-game-text font-medium text-base hover:border-brand/40 transition-colors"
          >
            연습 모드
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl animate-fade-in-up">
          <FeatureCard
            icon={<Hash className="w-5 h-5 text-brand" />}
            title="수식 추론"
            description="6번의 시도 안에 수학 방정식을 완성하세요"
          />
          <FeatureCard
            icon={<Trophy className="w-5 h-5 text-yellow-400" />}
            title="리더보드"
            description="최단 시간, 최소 시도로 순위에 오르세요"
          />
          <FeatureCard
            icon={<BookOpen className="w-5 h-5 text-green-400" />}
            title="다양한 난이도"
            description="사칙연산부터 삼각함수까지 단계별 도전"
          />
        </div>

        {/* How to play */}
        <div className="mt-16 w-full max-w-md">
          <h2 className="text-lg font-bold text-game-text mb-4 text-center">
            플레이 방법
          </h2>
          <div className="glass-card p-5 space-y-3">
            <HowToStep
              step="1"
              text="수식 키패드를 이용해 수학 방정식을 입력하세요"
            />
            <HowToStep
              step="2"
              text="확인 버튼을 누르면 각 토큰의 힌트가 표시됩니다"
            />
            <HowToStep
              step="3"
              text="초록색은 정확한 위치, 노란색은 다른 위치에 있음을 의미합니다"
            />
            <HowToStep step="4" text="6번 안에 정답을 완성하면 성공입니다!" />

            <div className="flex items-center gap-3 pt-2 border-t border-game-border">
              <TileExample color="bg-tile-correct" label="정확한 위치" />
              <TileExample color="bg-tile-present" label="다른 위치" />
              <TileExample color="bg-tile-absent" label="없음" />
            </div>
          </div>
        </div>

        {/* Leaderboard link */}
        <div className="mt-8">
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 text-sm text-game-text-muted hover:text-game-text transition-colors"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            오늘의 리더보드 보기
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-game-muted py-6 border-t border-game-border">
        Mathdle — 수학 방정식 워들 게임
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="mb-2">{icon}</div>
      <h3 className="text-sm font-semibold text-game-text mb-1">{title}</h3>
      <p className="text-xs text-game-text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function HowToStep({ step, text }: { step: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand/20 text-brand text-xs font-bold flex items-center justify-center">
        {step}
      </span>
      <p className="text-sm text-game-text-muted">{text}</p>
    </div>
  );
}

function TileExample({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-5 h-5 rounded ${color}`} />
      <span className="text-xs text-game-text-muted">{label}</span>
    </div>
  );
}
