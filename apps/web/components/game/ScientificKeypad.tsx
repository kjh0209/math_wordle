"use client";

import { useState } from "react";
import { Delete, RotateCcw, CornerDownLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { KeypadButton } from "./KeypadButton";
import type { KeypadGroup, KeypadToken, ReservedBlock } from "@/types/puzzle";
import type { KeyboardState } from "@/types/game";

export interface BlockInsertPayload {
  blockType: ReservedBlock;
  fields: Record<string, string>;
}

interface ScientificKeypadProps {
  groups: KeypadGroup[];
  keyboardState: KeyboardState;
  disabled?: boolean;
  onToken: (token: KeypadToken) => void;
  onBlockInsert: (payload: BlockInsertPayload) => void;
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
  onBlockInsert,
  onDelete,
  onClear,
  onSubmit,
  className,
}: ScientificKeypadProps) {
  // Pending block: user pressed a block button and must fill in fields
  const [pendingBlock, setPendingBlock] = useState<{
    token: KeypadToken;
    fields: Record<string, string>;
  } | null>(null);

  function handleTokenPress(token: KeypadToken) {
    if (disabled) return;

    if (token.type === "block") {
      if ((token.blockFieldCount ?? 0) === 0) {
        // No fields — insert immediately
        onBlockInsert({ blockType: token.blockType!, fields: {} });
      } else {
        // Show field input form
        const defaultFields: Record<string, string> = {};
        (token.blockFieldNames ?? []).forEach((name) => (defaultFields[name] = ""));
        setPendingBlock({ token, fields: defaultFields });
      }
      return;
    }

    onToken(token);
  }

  function handleBlockConfirm() {
    if (!pendingBlock) return;
    onBlockInsert({
      blockType: pendingBlock.token.blockType!,
      fields: pendingBlock.fields,
    });
    setPendingBlock(null);
  }

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      {/* Block field input form */}
      {pendingBlock && (
        <div className="rounded-xl border border-brand/40 bg-game-card p-3 flex flex-col gap-2 animate-fade-in">
          <p className="text-xs font-semibold text-brand">
            {pendingBlock.token.display} — 값을 입력하세요
          </p>
          <div className="flex gap-2 flex-wrap">
            {(pendingBlock.token.blockFieldNames ?? []).map((fieldName) => (
              <div key={fieldName} className="flex items-center gap-1.5">
                <label className="text-xs text-game-muted">{fieldName}:</label>
                <input
                  type="text"
                  className={cn(
                    "w-16 h-8 px-2 rounded-lg text-sm text-center font-mono",
                    "bg-game-surface border border-game-border text-game-text",
                    "focus:outline-none focus:border-brand"
                  )}
                  value={pendingBlock.fields[fieldName] ?? ""}
                  onChange={(e) =>
                    setPendingBlock((prev) =>
                      prev
                        ? { ...prev, fields: { ...prev.fields, [fieldName]: e.target.value } }
                        : null
                    )
                  }
                  placeholder="?"
                  autoFocus
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBlockConfirm}
              className="flex-1 h-8 rounded-lg bg-brand text-white text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> 삽입
            </button>
            <button
              type="button"
              onClick={() => setPendingBlock(null)}
              className="px-3 h-8 rounded-lg bg-game-surface border border-game-border text-game-muted text-xs"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Token / Block groups */}
      {groups.map((group) => (
        <div key={group.id}>
          <p className="text-xs text-game-muted mb-1.5 px-0.5">{group.label}</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {group.tokens.map((token) => (
              <KeypadButton
                key={`${token.type}-${token.value}`}
                token={token}
                keyState={keyboardState[token.value] ?? "unused"}
                disabled={disabled}
                onPress={handleTokenPress}
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
