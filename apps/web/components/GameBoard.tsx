import type { FeedbackColor } from "@/lib/types";

type Attempt = { guess: string; colors: FeedbackColor[] };

export function GameBoard({
  length,
  maxAttempts,
  attempts,
  currentInput
}: {
  length: number;
  maxAttempts: number;
  attempts: Attempt[];
  currentInput: string;
}) {
  const rows = Array.from({ length: maxAttempts }).map((_, rowIndex) => {
    const attempt = attempts[rowIndex];
    if (attempt) {
      return {
        chars: attempt.guess.split(""),
        colors: attempt.colors
      };
    }
    const chars =
      rowIndex === attempts.length
        ? currentInput.padEnd(length, " ").split("")
        : Array.from({ length }).map(() => " ");
    return {
      chars,
      colors: Array.from({ length }).map(() => undefined)
    };
  });

  return (
    <div className="board">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="row">
          {row.chars.map((ch, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`cell ${row.colors[colIndex] ?? ""}`.trim()}
            >
              {ch}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
