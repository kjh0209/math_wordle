import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ValidationErrorListProps {
  errors: unknown;
  className?: string;
}

export function ValidationErrorList({ errors, className }: ValidationErrorListProps) {
  if (!errors) return null;

  const items = parseErrors(errors);
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-red-800/60 bg-red-900/20 p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        <p className="text-sm font-medium text-red-300">검증 오류</p>
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((msg, i) => (
          <li key={i} className="text-xs text-red-400 flex gap-1.5">
            <span className="flex-shrink-0">•</span>
            <span>{msg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function parseErrors(errors: unknown): string[] {
  if (typeof errors === "string") return [errors];
  if (Array.isArray(errors))
    return errors.map((e) => (typeof e === "string" ? e : JSON.stringify(e)));
  if (typeof errors === "object" && errors !== null) {
    return Object.entries(errors).map(([k, v]) => `${k}: ${String(v)}`);
  }
  return [];
}
