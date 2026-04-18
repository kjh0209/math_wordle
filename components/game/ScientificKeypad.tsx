"use client";

import { Delete, RotateCcw, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { KeypadButton } from "./KeypadButton";
import type { KeypadGroup, KeypadToken } from "@/types/puzzle";
import type { KeyboardState } from "@/types/game";

interface ScientificKeypadProps {
  groups: KeypadGroup[];
  keyboardState: KeyboardState;
  disabled?: boolean;
  onToken: (token: KeypadToken) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit: () => void;
  className?: string;
}

export function ScientificKeypad({
  groups,
  keyboardState,
  disabled = false,
  onToken,
  onDelete,
  onClear,
  onSubmit,
  className,
}: ScientificKeypadProps) {
  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      {/* Token groups */}
      {groups.map((group) => (
        <div key={group.id}>
          <p className="text-xs text-game-muted mb-1.5 px-0.5">{group.label}</p>
          <div
            className={cn(
              "grid gap-1.5",
              group.id === "numbers"
                ? "grid-cols-4 sm:grid-cols-6"
                : "grid-cols-4 sm:grid-cols-6"
            )}
          >
            {group.tokens.map((token) => (
              <KeypadButton
                key={token.value}
                token={token}
                keyState={keyboardState[token.value] ?? "unused"}
                disabled={disabled}
                onPress={onToken}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Action row */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-game-border">
        <ActionButton
          label="지우기"
          icon={<Delete className="w-4 h-4" />}
          disabled={disabled}
          onClick={onDelete}
          className="bg-key-action hover:bg-key-action-hover"
        />
        <ActionButton
          label="전체삭제"
          icon={<RotateCcw className="w-4 h-4" />}
          disabled={disabled}
          onClick={onClear}
          className="bg-key-action hover:bg-key-action-hover"
        />
        <ActionButton
          label="확인"
          icon={<CornerDownLeft className="w-4 h-4" />}
          disabled={disabled}
          onClick={onSubmit}
          className="bg-brand hover:bg-brand-600 text-white font-bold"
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  disabled,
  onClick,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "key-btn h-12 flex-col gap-0.5 text-xs rounded-lg",
        "text-game-text",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {icon}
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  );
}
