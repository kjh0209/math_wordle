"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { Lock, Unlock, Map as MapIcon, ChevronRight } from "lucide-react";
import type { GetStagesResponse } from "@/types/api";

export default function HomePage() {
  const [stages, setStages] = useState<GetStagesResponse["stages"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStages() {
      // Temporarily simple fetch. Real logic will pass sessionKey to get progress.
      try {
        const res = await fetch("/api/stages");
        const data = await res.json() as GetStagesResponse;
        setStages(data.stages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStages();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-game-bg text-game-text">
      <AppHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <MapIcon className="w-8 h-8 text-brand" />
          <h1 className="text-3xl font-bold tracking-tight">Stage Map</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 text-game-text-muted">Loading stages...</div>
        ) : (
          <div className="space-y-4">
            {stages.map((node, i) => {
              // For mockup, stage 1 is always unlocked, stage 2 locked unless progress says otherwise
              const isUnlocked = node.progress?.unlocked || i === 0;
              
              return (
                <Link
                  key={node.stage.id}
                  href={isUnlocked ? `/stage/${node.stage.id}` : "#"}
                  className={`block rounded-2xl p-6 transition-all border ${
                    isUnlocked 
                      ? "bg-game-card border-brand/40 hover:border-brand shadow-lg cursor-pointer transform hover:-translate-y-1" 
                      : "bg-game-bg border-game-border opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {isUnlocked ? <Unlock className="w-4 h-4 text-brand" /> : <Lock className="w-4 h-4 text-game-muted" />}
                        <span className="text-sm font-semibold tracking-wider text-game-text-muted uppercase">
                          Stage {node.stage.stageNumber}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold mb-1">{node.stage.title}</h2>
                      <p className="text-game-text-muted text-sm">{node.stage.description}</p>
                    </div>
                    {isUnlocked && (
                      <ChevronRight className="w-6 h-6 text-brand" />
                    )}
                  </div>
                  
                  {isUnlocked && (
                    <div className="mt-4 pt-4 border-t border-game-border flex items-center justify-between text-sm">
                      <span className="text-game-text-muted">Steps Cleared:</span>
                      <span className="font-medium">{node.progress?.clearedStepsCount || 0} / 10</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
