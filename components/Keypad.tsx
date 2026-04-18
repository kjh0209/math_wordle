import type { FeedbackColor } from "@/lib/types";

export function Keypad({
  keys,
  keyboardState,
  onKeyPress,
  onDelete,
  onSubmit,
  disabled = false
}: {
  keys: string[];
  keyboardState: Record<string, FeedbackColor>;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="keypad">
        {keys.map((key) => (
          <button
            key={key}
            className={`key ${keyboardState[key] ?? ""}`.trim()}
            onClick={() => onKeyPress(key)}
            disabled={disabled}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="actions">
        <button className="btn secondary" onClick={onDelete} disabled={disabled}>
          삭제
        </button>
        <button className="btn primary" onClick={onSubmit} disabled={disabled}>
          제출
        </button>
      </div>
    </>
  );
}
