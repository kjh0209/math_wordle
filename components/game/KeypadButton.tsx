"use client";

import { cn } from "@/lib/utils/cn";
import type { KeyState } from "@/types/game";
import type { KeypadToken } from "@/types/puzzle";

interface KeypadButtonProps {
  token: KeypadToken;
  keyState?: KeyState;
  disabled?: boolean;
  onPress: (token: KeypadToken) => void;
}

const KEY_STATE_CLASSES: Record<KeyState, string> = {
  correct: "key-btn-correct",
  present: "key-btn-present",
  absent: "key-btn-absent",
  unused: "key-btn-default",
};

export function KeypadButton({
  token,
  keyState = "unused",
  disabled,
  onPress,
}: KeypadButtonProps) {
  const stateClass =
    token.type === "action"
      ? "key-btn-action"
      : KEY_STATE_CLASSES[keyState];

  return (
    <button
      type="button"
      disabled={disabled || token.disabled}
      onClick={() => onPress(token)}
      className={cn(
        "key-btn h-12 text-sm",
        token.width === "wide" ? "col-span-2" : "",
        stateClass
      )}
      aria-label={`Key: ${token.display}`}
    >
      {token.display}
    </button>
  );
}
