"use client";

import { useState } from "react";
import { Delete, RotateCcw, CornerDownLeft, X, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { KeypadButton } from "./KeypadButton";
import { buildBlockDisplay } from "@/lib/puzzles/puzzle-adapter";
import type { KeypadGroup, KeypadToken, BlockKeypadToken, BlockCell } from "@/types/puzzle";
import type { KeyboardState } from "@/types/game";

interface ScientificKeypadProps {
  groups: KeypadGroup[];
  keyboardState: KeyboardState;
  disabled?: boolean;
  onToken: (token: KeypadToken) => void;
  onBlock: (block: BlockCell) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit: () => void;
  className?: string;
}

interface PendingBlock {
  token: BlockKeypadToken;
  fields: Record<string, string>;
}

export function ScientificKeypad({
  groups,
  keyboardState,
  disabled = false,
  onToken,
  onBlock,
  onDelete,
  onClear,
  onSubmit,
  className,
}: ScientificKeypadProps) {
  const [pending, setPending] = useState<PendingBlock | null>(null);

  function handleBlockPress(bt: BlockKeypadToken) {
    const fieldNames = Object.keys(bt.fieldLabels);
    if (fieldNames.length === 0) {
      // dx has no fields — append immediately
      const display = buildBlockDisplay(bt.blockType, {});
      onBlock({ type: "block", blockType: bt.blockType, value: bt.blockType, fields: {}, display });
      return;
    }
    const emptyFields: Record<string, string> = {};
    for (const k of fieldNames) emptyFields[k] = "";
    setPending({ token: bt, fields: emptyFields });
  }

  function confirmBlock() {
    if (!pending) return;
    const display = buildBlockDisplay(pending.token.blockType, pending.fields);
    onBlock({
      type: "block",
      blockType: pending.token.blockType,
      value: pending.token.blockType,
      fields: { ...pending.fields },
      display,
    });
    setPending(null);
  }

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>

      {/* Block field-input panel */}
      {pending && (
        <div className="bg-game-card border border-brand/50 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-game-text">
              {pending.token.display} 입력
            </span>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="text-game-muted hover:text-game-text"
              aria-label="취소"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {Object.entries(pending.token.fieldLabels).map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1 flex-1 min-w-[80px]">
                <span className="text-xs text-game-muted">{label}</span>
                <input
                  type="text"
                  value={pending.fields[key] ?? ""}
                  onChange={(e) =>
                    setPending((p) =>
                      p ? { ...p, fields: { ...p.fields, [key]: e.target.value } } : null
                    )
                  }
                  className={cn(
                    "w-full h-9 px-2 rounded-lg text-sm font-mono",
                    "bg-game-bg border border-game-border text-game-text",
                    "focus:outline-none focus:border-brand"
                  )}
                  placeholder={label}
                  autoFocus={Object.keys(pending.token.fieldLabels)[0] === key}
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={confirmBlock}
            disabled={Object.values(pending.fields).some((v) => !v.trim())}
            className={cn(
              "w-full h-9 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5",
              "bg-brand text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <Check className="w-4 h-4" />
            확인
          </button>
        </div>
      )}

      {/* Token groups */}
      {groups.map((group) => (
        <div key={group.id}>
          <p className="text-xs text-game-muted mb-1.5 px-0.5">{group.label}</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {group.tokens.map((token) => {
              if (token.type === "block") {
                const bt = token as BlockKeypadToken;
                return (
                  <button
                    key={bt.blockType}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleBlockPress(bt)}
                    className={cn(
                      "key-btn h-12 text-xs font-semibold",
                      "bg-brand/20 border border-brand/40 text-brand",
                      "hover:bg-brand/30",
                      disabled && "opacity-40 cursor-not-allowed"
                    )}
                    aria-label={`Block: ${bt.display}`}
                  >
                    {bt.display}
                  </button>
                );
              }
              const kt = token as KeypadToken;
              return (
                <KeypadButton
                  key={kt.value}
                  token={kt}
                  keyState={keyboardState[kt.value] ?? "unused"}
                  disabled={disabled}
                  onPress={onToken}
                />
              );
            })}
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
  label, icon, disabled, onClick, className,
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
        "key-btn h-12 flex-col gap-0.5 text-xs rounded-lg text-game-text",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {icon}
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  );
}
