/**
 * Unit tests for compareGuessCells — Wordle-style duplicate token handling.
 *
 * Rules verified:
 *   1. Exact-position matches are always green, regardless of frequency.
 *   2. "Present" (yellow) is awarded only when the answer has an unmatched
 *      remaining copy of that token — never exceeding the answer frequency.
 *   3. Extra duplicates beyond the answer's frequency are gray, not yellow.
 *   4. Block cells: the block TYPE is compared for green/yellow;
 *      internal field tokens are compared via nested paths independently.
 */

import { describe, it, expect } from "vitest";
import { compareGuessCells } from "./validator";
import type { PuzzleCell } from "../types/puzzle";
import type { FeedbackColor, NestedFeedback } from "../types/game";

// ── Helpers ───────────────────────────────────────────────────────────────────

function tok(value: string): PuzzleCell {
  return { type: "token", value };
}

function cells(...values: string[]): PuzzleCell[] {
  return values.map(tok);
}

/** Extract top-level colors from NestedFeedback array */
function colors(feedback: NestedFeedback[]): FeedbackColor[] {
  return feedback.map(f => f.color);
}

function result(...cs: FeedbackColor[]): FeedbackColor[] {
  return cs;
}

// ── Basic cases ───────────────────────────────────────────────────────────────

describe("compareGuessCells — basic", () => {
  it("all correct", () => {
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("3", "+", "4", "=", "7");
    expect(colors(compareGuessCells(guess, answer))).toEqual(
      result("correct", "correct", "correct", "correct", "correct")
    );
  });

  it("all absent", () => {
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("1", "*", "2", "/", "5");
    expect(colors(compareGuessCells(guess, answer))).toEqual(
      result("absent", "absent", "absent", "absent", "absent")
    );
  });

  it("present in wrong position", () => {
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("7", "=", "4", "+", "3");
    expect(colors(compareGuessCells(guess, answer))).toEqual(
      result("present", "present", "correct", "present", "present")
    );
  });
});

// ── Duplicate token rules ─────────────────────────────────────────────────────

describe("compareGuessCells — duplicate token handling", () => {
  it("guess has more copies than answer: extras are gray", () => {
    const answer = cells("1", "+", "2", "=", "3");
    const guess  = cells("1", "+", "1", "=", "3");
    const fb = colors(compareGuessCells(guess, answer));
    expect(fb[0]).toBe("correct");
    expect(fb[2]).toBe("absent");
    expect(fb[3]).toBe("correct");
    expect(fb[4]).toBe("correct");
  });

  it("guess has two copies, answer has two copies, both correct", () => {
    const answer = cells("1", "1", "+", "2");
    const guess  = cells("1", "1", "+", "2");
    expect(colors(compareGuessCells(guess, answer))).toEqual(
      result("correct", "correct", "correct", "correct")
    );
  });

  it("guess has two copies, answer has two: one correct one present", () => {
    const answer = cells("1", "+", "1", "=", "2");
    const guess  = cells("2", "+", "1", "=", "1");
    const fb = colors(compareGuessCells(guess, answer));
    expect(fb[2]).toBe("correct");
    expect(fb[4]).toBe("present");
    expect(fb[0]).toBe("present");
  });

  it("only one yellow even when guess repeats a token the answer has once", () => {
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("3", "+", "3", "=", "7");
    const fb = colors(compareGuessCells(guess, answer));
    expect(fb[0]).toBe("correct");
    expect(fb[2]).toBe("absent");
  });

  it("present cap: guess has 3 copies, answer has 2, third copy is gray", () => {
    const answer = cells("1", "+", "1", "+", "2");
    const guess  = cells("1", "1", "1", "+", "2");
    const fb = colors(compareGuessCells(guess, answer));
    expect(fb[0]).toBe("correct");
    expect(fb[1]).toBe("absent");
    expect(fb[2]).toBe("correct");
    expect(fb[3]).toBe("correct");
    expect(fb[4]).toBe("correct");
  });

  it("present: guess has 2 copies, answer has 2, one exact + one present", () => {
    const answer = cells("1", "+", "1", "+", "2");
    const guess  = cells("2", "+", "1", "+", "1");
    const fb = colors(compareGuessCells(guess, answer));
    expect(fb[0]).toBe("present");
    expect(fb[1]).toBe("correct");
    expect(fb[2]).toBe("correct");
    expect(fb[3]).toBe("correct");
    expect(fb[4]).toBe("present");
  });

  it("repeated operator: answer has one '=', guess has two '='", () => {
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("3", "=", "4", "=", "7");
    const fb = colors(compareGuessCells(guess, answer));
    expect(fb[0]).toBe("correct");
    expect(fb[1]).toBe("absent");
    expect(fb[2]).toBe("correct");
    expect(fb[3]).toBe("correct");
    expect(fb[4]).toBe("correct");
  });

  it("repeated '=' correct position takes priority over present", () => {
    const answer = cells("1", "+", "2", "=", "3");
    const guess  = cells("=", "+", "2", "=", "3");
    const fb = colors(compareGuessCells(guess, answer));
    expect(fb[3]).toBe("correct");
    expect(fb[0]).toBe("absent");
    expect(fb[1]).toBe("correct");
    expect(fb[2]).toBe("correct");
    expect(fb[4]).toBe("correct");
  });
});

// ── Block cell handling ───────────────────────────────────────────────────────

describe("compareGuessCells — block cells", () => {
  it("exact block match is correct", () => {
    const log2 = (): PuzzleCell => ({
      type: "block", blockType: "LogBase", fields: { base: "2" },
      cellFields: { base: [tok("2")] },
    });
    const answer: PuzzleCell[] = [log2(), tok("("), tok("x"), tok(")"), tok("="), tok("3")];
    const guess: PuzzleCell[]  = [log2(), tok("("), tok("x"), tok(")"), tok("="), tok("3")];
    expect(colors(compareGuessCells(guess, answer))).toEqual(
      result("correct", "correct", "correct", "correct", "correct", "correct")
    );
  });

  it("block same type but different field: block itself is correct, field is absent", () => {
    // Answer: log₂(x)=1, Guess: log₃(x)=1
    // The log BLOCK is at the same position → correct (green)
    // The base field token "3" vs "2" → absent (gray inside the block)
    const log2 = (): PuzzleCell => ({
      type: "block", blockType: "LogBase", fields: { base: "2" },
      cellFields: { base: [tok("2")] },
    });
    const log3 = (): PuzzleCell => ({
      type: "block", blockType: "LogBase", fields: { base: "3" },
      cellFields: { base: [tok("3")] },
    });
    const answer: PuzzleCell[] = [log2(), tok("="), tok("1")];
    const guess: PuzzleCell[]  = [log3(), tok("="), tok("1")];
    const fb = compareGuessCells(guess, answer);
    // Block at pos 0: same blockType, same position → correct
    expect(fb[0].color).toBe("correct");
    // Base field: "3" vs "2" → absent
    expect(fb[0].fields?.base?.[0].color).toBe("absent");
    // Rest
    expect(fb[1].color).toBe("correct");
    expect(fb[2].color).toBe("correct");
  });

  it("block in wrong position is present", () => {
    const sig = (): PuzzleCell => ({
      type: "block", blockType: "SigmaRange", fields: { start: "1", end: "4" },
      cellFields: { start: [tok("1")], end: [tok("4")] },
    });
    const answer: PuzzleCell[] = [sig(), tok("i"), tok("="), tok("1"), tok("0")];
    const guess: PuzzleCell[]  = [tok("i"), sig(), tok("="), tok("1"), tok("0")];
    const fb = colors(compareGuessCells(guess, answer));
    expect(fb[0]).toBe("present"); // 'i' in answer at pos 1
    expect(fb[1]).toBe("present"); // SigmaRange in answer at pos 0
    expect(fb[2]).toBe("correct");
    expect(fb[3]).toBe("correct");
    expect(fb[4]).toBe("correct");
  });

  it("different block types are distinct", () => {
    const comb = (): PuzzleCell => ({
      type: "block", blockType: "Comb", fields: { n: "5", r: "2" },
      cellFields: { n: [tok("5")], r: [tok("2")] },
    });
    const perm = (): PuzzleCell => ({
      type: "block", blockType: "Perm", fields: { n: "5", r: "2" },
      cellFields: { n: [tok("5")], r: [tok("2")] },
    });
    const answer: PuzzleCell[] = [comb(), tok("="), tok("1"), tok("0")];
    const guess: PuzzleCell[]  = [perm(), tok("="), tok("1"), tok("0")];
    const fb = colors(compareGuessCells(guess, answer));
    expect(fb[0]).toBe("absent"); // Perm ≠ Comb
    expect(fb[1]).toBe("correct");
  });
});
