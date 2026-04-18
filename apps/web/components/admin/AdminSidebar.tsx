"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Zap, ListOrdered, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  {
    href: "/admin/puzzles",
    label: "퍼즐 관리",
    icon: FileText,
  },
  {
    href: "/admin/puzzles/new",
    label: "퍼즐 생성",
    icon: Zap,
  },
  {
    href: "/admin/generation-jobs",
    label: "생성 작업",
    icon: ListOrdered,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col gap-1">
      {/* Brand */}
      <div className="px-3 py-3 mb-2">
        <span className="text-xs font-semibold text-game-muted uppercase tracking-widest">
          Admin
        </span>
      </div>

      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium",
              "transition-colors duration-150",
              active
                ? "bg-brand/20 text-brand border border-brand/30"
                : "text-game-text-muted hover:text-game-text hover:bg-game-card"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
            {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </Link>
        );
      })}

      <div className="mt-4 pt-4 border-t border-game-border px-3">
        <Link
          href="/"
          className="text-xs text-game-muted hover:text-game-text transition-colors"
        >
          ← 게임으로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
