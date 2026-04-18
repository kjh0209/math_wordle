import { cn } from "@/lib/utils/cn";
import type { ValidationStatus } from "@/types/puzzle";

const STATUS_CONFIG: Record<
  ValidationStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "초안",
    className: "bg-gray-700/50 text-gray-400 border-gray-600",
  },
  valid: {
    label: "검증됨",
    className: "bg-blue-900/50 text-blue-300 border-blue-700",
  },
  rejected: {
    label: "거절됨",
    className: "bg-red-900/50 text-red-300 border-red-700",
  },
  published: {
    label: "게시됨",
    className: "bg-green-900/50 text-green-300 border-green-700",
  },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; className: string }> =
  {
    easy: {
      label: "쉬움",
      className: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    },
    medium: {
      label: "보통",
      className: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
    },
    hard: {
      label: "어려움",
      className: "bg-orange-900/40 text-orange-300 border-orange-700",
    },
    expert: {
      label: "전문가",
      className: "bg-red-900/40 text-red-300 border-red-700",
    },
  };

interface PuzzleStatusBadgeProps {
  status?: ValidationStatus;
  difficulty?: string | null;
  className?: string;
}

export function PuzzleStatusBadge({ status, difficulty, className }: PuzzleStatusBadgeProps) {
  const statusCfg = status ? STATUS_CONFIG[status] : null;
  const diffCfg = difficulty ? (DIFFICULTY_CONFIG[difficulty.toLowerCase()] ?? null) : null;

  if (!statusCfg && !diffCfg) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {statusCfg && (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
            statusCfg.className
          )}
        >
          {statusCfg.label}
        </span>
      )}
      {diffCfg && (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
            diffCfg.className
          )}
        >
          {diffCfg.label}
        </span>
      )}
    </div>
  );
}
