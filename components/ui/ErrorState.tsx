import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = "오류가 발생했습니다",
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
    >
      <AlertTriangle className="w-10 h-10 text-red-400 mb-3 opacity-80" />
      <h3 className="text-base font-semibold text-game-text mb-1">{title}</h3>
      <p className="text-sm text-game-text-muted max-w-xs">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
