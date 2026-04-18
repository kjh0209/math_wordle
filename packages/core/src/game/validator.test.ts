/**
 * Unit tests for compareGuessCells — Wordle-style duplicate token handling.
 *
 * Rules verified:
 *   1. Exact-position matches are always green, regardless of frequency.
 *   2. "Present" (yellow) is awarded only when the answer has an unmatched
 *      remaining copy of that token — never exceeding the answer frequency.
 *   3. Extra duplicates beyond the answer's frequency are gray, not yellow.
 */

import { describe, it, expect } from "vitest";
import { compareGuessCells } from "./validator";
import type { PuzzleCell, FeedbackColor } from "../types/puzzle";

// ── Helpers ───────────────────────────────────────────────────────────────────

function tok(value: string): PuzzleCell {
  return { type: "token", value };
}

function cells(...values: string[]): PuzzleCell[] {
  return values.map(tok);
}

function result(...colors: FeedbackColor[]): FeedbackColor[] {
  return colors;
}

// ── Basic cases ───────────────────────────────────────────────────────────────

describe("compareGuessCells — basic", () => {
  it("all correct", () => {
    // answer: 3+4=7   guess: 3+4=7
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("3", "+", "4", "=", "7");
    expect(compareGuessCells(guess, answer)).toEqual(
      result("correct", "correct", "correct", "correct", "correct")
    );
  });

  it("all absent", () => {
    // answer: 3+4=7   guess: 1*2/5
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("1", "*", "2", "/", "5");
    expect(compareGuessCells(guess, answer)).toEqual(
      result("absent", "absent", "absent", "absent", "absent")
    );
  });

  it("present in wrong position", () => {
    // answer: 3+4=7   guess: 7=4+3  (all tokens present, positions wrong)
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("7", "=", "4", "+", "3");
    expect(compareGuessCells(guess, answer)).toEqual(
      result("present", "present", "correct", "present", "present")
    );
  });
});

// ── Duplicate token rules ─────────────────────────────────────────────────────

describe("compareGuessCells — duplicate token handling", () => {
  it("guess has more copies than answer: extras are gray", () => {
    // answer: 1+2=3  (one '1')
    // guess:  1+1=3  (two '1's)
    // position 0: correct (1==1), position 2: absent (no extra '1' in answer)
    const answer = cells("1", "+", "2", "=", "3");
    const guess  = cells("1", "+", "1", "=", "3");
    const fb = compareGuessCells(guess, answer);
    expect(fb[0]).toBe("correct");  // first '1' — exact match
    expect(fb[2]).toBe("absent");   // second '1' — answer has no more '1's left
    expect(fb[3]).toBe("correct");  // '=' — exact match
    expect(fb[4]).toBe("correct");  // '3' — exact match
  });

  it("guess has two copies, answer has two copies, both correct", () => {
    // answer: 11+2  (two '1's)
    // guess:  11+2
    const answer = cells("1", "1", "+", "2");
    const guess  = cells("1", "1", "+", "2");
    expect(compareGuessCells(guess, answer)).toEqual(
      result("correct", "correct", "correct", "correct")
    );
  });

  it("guess has two copies, answer has two: one correct one present", () => {
    // answer: 1+1=2   (two '1's at positions 0 and 2)
    // guess:  2+1=1   (two '1's at positions 3 and 5 — both wrong positions)
    const answer = cells("1", "+", "1", "=", "2");
    const guess  = cells("2", "+", "1", "=", "1");
    // position 1 '+': correct
    // position 2 '1': correct (exact)
    // position 3 '=': correct
    // position 0 '2': present (answer has '2' at position 4)
    // position 4 '1': present? No — answer already used both '1's (pos 0 and pos 2)
    //   actually pos 2 is exact match (uses answer[2]), then pos 4 in guess:
    //   remaining unmatched answer tokens: position 0 ('1') — so it IS present
    const fb = compareGuessCells(guess, answer);
    expect(fb[2]).toBe("correct");  // '1' at exact position 2
    expect(fb[4]).toBe("present");  // second '1' — answer still has '1' at pos 0 unused
    expect(fb[0]).toBe("present");  // '2' — answer has it at pos 4
  });

  it("only one yellow even when guess repeats a token the answer has once", () => {
    // answer: 3+4=7   (one '3')
    // guess:  3+3=7   (two '3's — position 0 is correct, position 2 should be gray)
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("3", "+", "3", "=", "7");
    const fb = compareGuessCells(guess, answer);
    expect(fb[0]).toBe("correct");  // exact match at position 0
    expect(fb[2]).toBe("absent");   // no '3' left in answer
  });

  it("present cap: guess has 3 copies, answer has 2, third copy is gray", () => {
    // answer: [1, +, 1, +, 2]  (two '1's at pos 0 and 2)
    // guess:  [1, 1, 1, +, 2]  (three '1's)
    //
    // First pass (exact):
    //   pos 0: '1'=='1' → correct, used[0]=true
    //   pos 2: '1'=='1' → correct, used[2]=true
    //   pos 3: '+'=='+' → correct, used[3]=true
    //   pos 4: '2'=='2' → correct, used[4]=true
    // Second pass (pos 1, guess='1'):
    //   answer[0]='1' but used[0]=true → skip
    //   answer[2]='1' but used[2]=true → skip
    //   → no unused '1' remaining → absent
    const answer = cells("1", "+", "1", "+", "2");
    const guess  = cells("1", "1", "1", "+", "2");
    const fb = compareGuessCells(guess, answer);
    expect(fb[0]).toBe("correct");  // exact
    expect(fb[1]).toBe("absent");   // answer's two '1's already consumed as exact matches
    expect(fb[2]).toBe("correct");  // exact
    expect(fb[3]).toBe("correct");  // exact
    expect(fb[4]).toBe("correct");  // exact
  });

  it("present: guess has 2 copies, answer has 2, one exact + one present", () => {
    // answer: [1, +, 1, +, 2]
    // guess:  [2, +, 1, +, 1]  ('1' at pos 2 exact, '1' at pos 4 present via answer pos 0)
    //
    // First pass: pos 1, 2, 3 exact. Second pass:
    //   pos 0 ('2'): answer[4]='2' unused → present
    //   pos 4 ('1'): answer[0]='1' unused → present
    const answer = cells("1", "+", "1", "+", "2");
    const guess  = cells("2", "+", "1", "+", "1");
    const fb = compareGuessCells(guess, answer);
    expect(fb[0]).toBe("present");  // '2' is in answer at pos 4
    expect(fb[1]).toBe("correct");
    expect(fb[2]).toBe("correct");  // exact match
    expect(fb[3]).toBe("correct");
    expect(fb[4]).toBe("present");  // '1' matches answer pos 0 (still unused)
  });

  it("repeated operator: answer has one '=', guess has two '='", () => {
    // answer: [3, +, 4, =, 7]  (one '=')
    // guess:  [3, =, 4, =, 7]  (two '='s — pos 3 correct, pos 1 absent)
    //
    // First pass: pos 0,2,3,4 correct (note: guess[2]='4'==answer[2]='4').
    //   used = [true, false, true, true, true]
    // Second pass (pos 1, guess='='):
    //   answer[3]='=' but used[3]=true → skip → absent
    const answer = cells("3", "+", "4", "=", "7");
    const guess  = cells("3", "=", "4", "=", "7");
    const fb = compareGuessCells(guess, answer);
    expect(fb[0]).toBe("correct");  // '3' exact
    expect(fb[1]).toBe("absent");   // '=' — answer's '=' already used at pos 3
    expect(fb[2]).toBe("correct");  // '4' exact (not absent!)
    expect(fb[3]).toBe("correct");  // '=' exact
    expect(fb[4]).toBe("correct");  // '7' exact
  });

  it("repeated '=' correct position takes priority over present", () => {
    const answer = cells("1", "+", "2", "=", "3");
    const guess  = cells("=", "+", "2", "=", "3");
    const fb = compareGuessCells(guess, answer);
    expect(fb[3]).toBe("correct");  // '=' exact
    expect(fb[0]).toBe("absent");   // '=' — already used in answer at pos 3
    expect(fb[1]).toBe("correct");  // '+'
    expect(fb[2]).toBe("correct");  // '2'
    expect(fb[4]).toBe("correct");  // '3'
  });
});

// ── Block cell handling ───────────────────────────────────────────────────────

describe("compareGuessCells — block cells", () => {
  it("exact block match is correct", () => {
    const log2 = (): PuzzleCell => ({ type: "block", blockType: "LogBase", fields: { base: "2" } });
    const answer: PuzzleCell[] = [log2(), tok("("), tok("x"), tok(")"), tok("="), tok("3")];
    const guess: PuzzleCell[]  = [log2(), tok("("), tok("x"), tok(")"), tok("="), tok("3")];
    expect(compareGuessCells(guess, answer)).toEqual(
      result("correct", "correct", "correct", "correct", "correct", "correct")
    );
  });

  it("block with different fields is a different token", () => {
    const log2 = (): PuzzleCell => ({ type: "block", blockType: "LogBase", fields: { base: "2" } });
    const log3 = (): PuzzleCell => ({ type: "block", blockType: "LogBase", fields: { base: "3" } });
    // answer starts with log₂, guess starts with log₃
    const answer: PuzzleCell[] = [log2(), tok("="), tok("1")];
    const guess: PuzzleCell[]  = [log3(), tok("="), tok("1")];
    const fb = compareGuessCells(guess, answer);
    expect(fb[0]).toBe("absent");   // log₃ ≠ log₂
    expect(fb[1]).toBe("correct");
    expect(fb[2]).toBe("correct");
  });

  it("block present in wrong position", () => {
    const sig = (): PuzzleCell => ({
      type: "block", blockType: "SigmaRange", fields: { start: "1", end: "4" },
    });
    // answer: [SigmaRange, i, =, 1, 0]
    // guess:  [i, SigmaRange, =, 1, 0]
    const answer: PuzzleCell[] = [sig(), tok("i"), tok("="), tok("1"), tok("0")];
    const guess: PuzzleCell[]  = [tok("i"), sig(), tok("="), tok("1"), tok("0")];
    const fb = compareGuessCells(guess, answer);
    expect(fb[0]).toBe("present");  // 'i' is in answer at pos 1
    expect(fb[1]).toBe("present");  // SigmaRange is in answer at pos 0
    expect(fb[2]).toBe("correct");
    expect(fb[3]).toBe("correct");
    expect(fb[4]).toBe("correct");
  });
});
