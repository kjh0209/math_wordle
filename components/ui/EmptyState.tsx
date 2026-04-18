import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-game-muted opacity-40 text-5xl">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-game-text-muted mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-game-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
