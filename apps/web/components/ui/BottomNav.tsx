"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/", activeIcon: "/sprites/bottomnav-map-active.png", inactiveIcon: "/sprites/bottomnav-map.png", label: "Map" },
  { href: "/leaderboard", activeIcon: "/sprites/bottomnav-ranking-active.png", inactiveIcon: "/sprites/bottomnav-ranking.png", label: "Ranking" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{ background: "#080e1c", borderTop: "2px solid #1e2d4a" }}
    >
      <div className="flex items-stretch justify-around h-14 max-w-sm mx-auto">
        {TABS.map(({ href, activeIcon, inactiveIcon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative"
            >
              {/* Active indicator — pixel top bar */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-sm"
                  style={{ width: 28, height: 3, background: "#eab308" }}
                />
              )}
              <img
                src={isActive ? activeIcon : inactiveIcon}
                alt={label}
                className="w-5 h-5 mb-1"
                style={{ imageRendering: "pixelated" }}
              />
              <span
                className={cn(
                  "text-[10px] tracking-widest uppercase transition-colors font-bold",
                  isActive ? "text-[#eab308]" : "text-[#4a5a7a]"
                )}
                style={{ fontFamily: 'monospace' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
