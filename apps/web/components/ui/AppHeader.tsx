"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AppHeaderProps {
  className?: string;
  /** Sub-pages: show plain title with back link instead of logo */
  title?: string;
  backHref?: string;
  rightSlot?: React.ReactNode;
}

export function AppHeader({ className, title, backHref, rightSlot }: AppHeaderProps) {
  return (
    <header
      className={cn("sticky top-0 z-40 w-full safe-top", className)}
      style={{ background: "#080e1c", borderBottom: "2px solid #1e2d4a" }}
    >
      <div className="max-w-sm mx-auto px-4 h-12 flex items-center justify-between gap-3">
        {/* Left: logo or back */}
        {backHref ? (
          <Link
            href={backHref}
            className="text-sm text-game-muted hover:text-game-text transition-colors"
          >
            ← {title ?? "뒤로"}
          </Link>
        ) : (
          <Link href="/" className="group">
            {/* Swap with <img src="/assets/logo.png" className="pixel-art h-7"> later */}
            <span className="font-mono font-black text-lg tracking-tight text-game-text group-hover:text-yellow-400 transition-colors">
              MATH<span className="text-yellow-400">LE</span>
            </span>
          </Link>
        )}

        {/* Right slot */}
        {rightSlot ?? (
          <Link
            href="/admin/puzzles"
            className="p-1.5 text-game-muted hover:text-game-text transition-colors"
            aria-label="관리자"
          >
            <Settings size={16} />
          </Link>
        )}
      </div>
    </header>
  );
}
