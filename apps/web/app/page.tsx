"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import type { GetStagesResponse } from "@/types/api";
import type { StageStep, StageMapNode } from "@mathdle/core";

// ── Types ─────────────────────────────────────────────────────────────────────

type StageFull = StageMapNode & { steps: StageStep[] };

// ── Map layout constants ──────────────────────────────────────────────────────

const SVG_W = 300;
const SVG_H = 430;
const NODE_HALF = 32;
const BOSS_HALF = 40;

// ── Colors (logo palette: yellow / green / dark) ──────────────────────────────

const C = {
  cleared: { fill: "#22c55e", stroke: "#16a34a", text: "#a3e635", path: "#4ade80" },
  active:  { fill: "#eab308", stroke: "#ca8a04", text: "#fef08a", path: "#facc15" },
  locked:  { fill: "#0f1729", stroke: "#1e2d4a", text: "#4a5a7a", path: "#1e2d4a" },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function nodeCoords(index: number, step: StageStep): { x: number; y: number } {
  if (step.isBoss) return { x: 150, y: 70 };
  
  const pathNodes = [
    { x: 150, y: 350 }, // 1-1 (Bottom Center)
    { x: 105, y: 250 }, // 1-2 (Off Left)
    { x: 195, y: 150 }, // 1-3 (Off Right)
  ];
  
  return pathNodes[index] || { x: 150, y: 350 - index * 100 };
}

function pathD(steps: StageStep[], count?: number): string {
  return (count !== undefined ? steps.slice(0, count) : steps)
    .map((s, i) => {
      const { x, y } = nodeCoords(i, s);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

// ── Home Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [stages, setStages] = useState<StageFull[]>([]);
  const [loading, setLoading] = useState(true);
  const activeStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/stages")
      .then((r) => r.json())
      .then((d: GetStagesResponse) => setStages(d.stages as StageFull[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && activeStageRef.current) {
      activeStageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, stages]);

  return (
    <div 
      className="min-h-screen flex flex-col text-white pb-10"
      style={{
        backgroundImage: "url('/sprites/map-bg.png')",
        backgroundSize: '256px 256px',
        backgroundRepeat: 'repeat',
        imageRendering: 'pixelated'
      }}
    >
      <main className="flex-1 w-full max-w-sm mx-auto px-4 pt-4 flex flex-col-reverse items-center justify-start gap-4">
        {loading ? (
          <p className="py-20 text-game-muted text-sm">불러오는 중...</p>
        ) : (
          stages.map((node, stageIdx) => {
            const isUnlocked = stageIdx === 0 || !!node.progress?.unlocked;
            const currentStepIndex = isUnlocked ? 0 : -1;
            const isCurrentStage = currentStepIndex >= 0;

            return (
              <div 
                key={node.stage.id} 
                className="w-full flex flex-col items-center z-10 relative"
                ref={isCurrentStage ? activeStageRef : null}
              >
                {/* Retro Stage Header */}
                <div className="flex flex-col items-center mb-6">
                  <span
                    className="text-white text-sm font-black tracking-widest uppercase drop-shadow-md"
                    style={{ fontFamily: 'monospace', imageRendering: 'pixelated' }}
                  >
                    WORLD {node.stage.stageNumber}: {node.stage.title}
                  </span>
                </div>

                {/* World map */}
                <WorldMap
                  steps={node.steps ?? []}
                  isUnlocked={isUnlocked}
                  currentStepIndex={currentStepIndex}
                />

                {/* Between-stage connector (path continuing) */}
                {stageIdx > 0 && (
                  <div className="flex flex-col items-center gap-0 my-[-10px] z-0">
                    <div className="w-1 h-12 border-l-[6px] border-dotted border-[#1e2d4a]" />
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* At the top of the map because flex-col-reverse */}
        <div className="flex flex-col items-center mt-8 z-10 w-full mb-8 pt-10">
          <img src="/sprites/logo.png" alt="Mathdle Logo" className="w-56" style={{ imageRendering: 'pixelated' }} />
        </div>
      </main>
      
      <div className="fixed bottom-0 w-full flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

// ── World Map SVG ─────────────────────────────────────────────────────────────

function WorldMap({
  steps,
  isUnlocked,
  currentStepIndex,
}: {
  steps: StageStep[];
  isUnlocked: boolean;
  currentStepIndex: number;
}) {
  const router = useRouter();
  if (!steps.length) return null;

  const DECOS = [
    { href: '/sprites/deco-plus.png', x: -40, y: 70, w: 140, h: 140 },
    { href: '/sprites/deco-times.png', x: -20, y: 260, w: 120, h: 120 },
    { href: '/sprites/deco-divide.png', x: 210, y: 30, w: 110, h: 110 },
    { href: '/sprites/deco-figure.png', x: 200, y: 260, w: 120, h: 120 },
  ];

  return (
    <div
      className="w-full relative overflow-visible"
      style={{
        maxWidth: SVG_W,
      }}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Hard pixel drop-shadow (no blur = pixel art feel) */}
          <filter id="px-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#000" floodOpacity="0.75" />
          </filter>
          
          <pattern id="path-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
            <image href="/sprites/path-tile.png" width="12" height="12" />
          </pattern>
        </defs>

        {/* Floating Deco Backgrounds (behind everything) */}
        <g opacity="0.8">
          {DECOS.map((deco, i) => (
            <image
              key={i}
              href={deco.href}
              x={deco.x}
              y={deco.y}
              width={deco.w}
              height={deco.h}
              style={{ imageRendering: "pixelated" }}
            />
          ))}
        </g>

        {/* Faint math symbols background scattered */}
        <image
          href="/sprites/NUM-SYM-SET.png"
          x="10"
          y="10"
          width="280"
          height="400"
          opacity="0.15"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Background path — dotted path */}
        <path
          d={pathD(steps)}
          fill="none"
          stroke="url(#path-pattern)"
          strokeWidth={8}
          strokeLinecap="square"
          strokeDasharray="8 8"
        />

        {/* Active path overlay up to (and including) current step */}
        {currentStepIndex >= 0 && (
          <path
            d={pathD(steps, currentStepIndex + 1)}
            fill="none"
            stroke={C.active.path}
            strokeWidth={8}
            strokeLinecap="square"
            strokeDasharray="8 12"
            opacity={0.8}
          />
        )}

        {/* Step nodes */}
        {steps.map((step, i) => {
          const { x, y } = nodeCoords(i, step);
          const half = step.isBoss ? BOSS_HALF : NODE_HALF;
          const isCurrent = i === currentStepIndex;
          const isCleared = false; // replaced with real progress later
          const isClickable = isCurrent || isCleared;

          const col = isCleared ? C.cleared : isCurrent ? C.active : C.locked;

          return (
            <g
              key={step.id}
              onClick={() => isClickable && router.push(`/step/${step.code}`)}
              style={{ cursor: isClickable ? "pointer" : "default" }}
            >
              {/* Outer glow ring on active node */}
              {isCurrent && (
                <rect
                  x={x - half - 5}
                  y={y - half - 5}
                  width={half * 2 + 10}
                  height={half * 2 + 10}
                  rx={5}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth={1.5}
                  opacity={0.35}
                />
              )}

              {/* Main block — use sprite images */}
              <image
                href={`/sprites/node-${step.isBoss ? 'boss' : 'normal'}-${isCleared ? 'cleared' : isCurrent ? 'unlocked' : 'locked'}.png`}
                x={x - half}
                y={y - half}
                width={half * 2}
                height={half * 2}
                filter="url(#px-shadow)"
              />

              {/* Sparkles around active node */}
              {isCurrent && (
                <>
                  <image href="/sprites/result-star.png" x={x - half - 15} y={y - half - 5} width={16} height={16} className="animate-pulse" />
                  <image href="/sprites/result-star.png" x={x + half + 5} y={y - half + 10} width={12} height={12} className="animate-bounce" />
                </>
              )}

              {/* Step code below block */}
              <text
                x={x}
                y={y + half + 16}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize={12}
                fontFamily="monospace"
                fontWeight="900"
                style={{ textShadow: "1px 1px 0px #000" }}
              >
                {step.code}
              </text>

              {/* BOSS label above boss node */}
              {step.isBoss && (
                <text
                  x={x}
                  y={y - half - 8}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isCurrent ? "#eab308" : "#4a5a7a"}
                  fontSize={8}
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="2"
                >
                  BOSS
                </text>
              )}
            </g>
          );
        })}

        {/* Player marker at current step — swap with character sprite later */}
        {currentStepIndex >= 0 && currentStepIndex < steps.length && (() => {
          const step = steps[currentStepIndex];
          const { x, y } = nodeCoords(currentStepIndex, step);
          const half = step.isBoss ? BOSS_HALF : NODE_HALF;
          const arrowTip = y - half - 4;

          return (
            <g style={{ animation: "float 2s ease-in-out infinite" }}>
              <style>{`
                @keyframes float {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-4px); }
                }
              `}</style>
              <image
                href="/sprites/player-idle.png"
                x={x - 16}
                y={y - half - 32} // positioned above the active node
                width={32}
                height={32}
                filter="url(#px-shadow)"
              />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
