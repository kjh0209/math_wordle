import { cn } from "@/lib/utils/cn";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ message = "로딩 중...", className, size = "md" }: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-[3px]",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full border-game-border border-t-brand animate-spin",
          sizeClasses[size]
        )}
      />
      {message && (
        <p className="text-sm text-game-text-muted animate-pulse">{message}</p>
      )}
    </div>
  );
}

export function InlineSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin",
        className
      )}
    />
  );
}
