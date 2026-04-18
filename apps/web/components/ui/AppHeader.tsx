"use client";

import Link from "next/link";
import { Trophy, FlaskConical, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-game-surface/80 backdrop-blur-md border-b border-game-border",
        className
      )}
    >
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold tracking-tight text-game-text group-hover:text-brand transition-colors">
            Math<span className="text-brand">dle</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <NavLink href="/play" icon={<FlaskConical className="w-4 h-4" />} label="Play" />
          <NavLink href="/leaderboard" icon={<Trophy className="w-4 h-4" />} label="Board" />
          <NavLink
            href="/admin/puzzles"
            icon={<Settings className="w-4 h-4" />}
            label="Admin"
            className="hidden sm:flex"
          />
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  icon,
  label,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
        "text-game-text-muted hover:text-game-text hover:bg-game-card",
        "transition-colors duration-150",
        className
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
