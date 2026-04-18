/**
 * lib/puzzles/spec-validator.ts
 *
 * Validates raw puzzle JSON against the finalized mathle spec.
 * Used by the import pipeline and admin routes before inserting to DB.
 */

import {
  SPEC_LEVELS,
  SPEC_DIFFICULTIES,
  SPEC_CATEGORIES,
  RESERVED_TOKENS,
  RESERVED_BLOCKS,
  BLOCK_DEFINITIONS,
} from "@mathdle/core";
import type { PuzzleRawPayload, PuzzleCell } from "@mathdle/core";

export interface SpecValidationError {
  field: string;
  message: string;
}

export interface SpecValidationResult {
  ok: boolean;
  errors: SpecValidationError[];
}

// ─── Helpers ────────────────────────────────────────────────────────────��─────

function err(field: string, message: string): SpecValidationError {
  return { field, message };
}

// ─── Cell validator ───────────────────────────────────────────────────────────

function validateCell(
  cell: unknown,
  index: number,
  shownTokens: string[],
  shownBlocks: string[]
): SpecValidationError[] {
  const errors: SpecValidationError[] = [];
  const prefix = `answer.cells[${index}]`;

  if (typeof cell !== "object" || cell === null) {
    errors.push(err(prefix, "cell must be an object"));
    return errors;
  }

  const c = cell as Record<string, unknown>;

  if (c.type !== "token" && c.type !== "block") {
    errors.push(err(`${prefix}.type`, `must be "token" or "block", got "${c.type}"`));
    return errors;
  }

  if (c.type === "token") {
    if (typeof c.value !== "string") {
      errors.push(err(`${prefix}.value`, "must be a string"));
    } else if (
      !(RESERVED_TOKENS as readonly string[]).includes(c.value) &&
      !/^\d$/.test(c.value)
    ) {
      errors.push(
        err(`${prefix}.value`, `"${c.value}" is not a reserved token`)
      );
    } else if (!shownTokens.includes(c.value)) {
      errors.push(
        err(`${prefix}.value`, `"${c.value}" used in answer but not listed in shownTokens`)
      );
    }
  }

  if (c.type === "block") {
    if (typeof c.blockType !== "string") {
      errors.push(err(`${prefix}.blockType`, "must be a string"));
      return errors;
    }
    if (!(RESERVED_BLOCKS as readonly string[]).includes(c.blockType)) {
      errors.push(
        err(`${prefix}.blockType`, `"${c.blockType}" is not a reserved block`)
      );
      return errors;
    }
    if (!shownBlocks.includes(c.blockType)) {
      errors.push(
        err(`${prefix}.blockType`, `"${c.blockType}" used in answer but not listed in shownBlocks`)
      );
    }
    const def = BLOCK_DEFINITIONS[c.blockType as keyof typeof BLOCK_DEFINITIONS];
    const fields = c.fields as Record<string, unknown> | undefined;
    if (!fields || typeof fields !== "object") {
      errors.push(err(`${prefix}.fields`, "must be an object"));
    } else {
      for (const fieldName of def.fieldNames) {
        if (!(fieldName in fields)) {
          errors.push(
            err(`${prefix}.fields.${fieldName}`, `required field "${fieldName}" missing`)
          );
        } else if (typeof fields[fieldName] !== "string") {
          errors.push(
            err(`${prefix}.fields.${fieldName}`, "must be a string")
          );
        }
      }
    }
  }

  return errors;
}

// ─── Main validator ───────────────────────────────────────────────────────────

export function validatePuzzleSpec(
  raw: unknown
): SpecValidationResult {
  const errors: SpecValidationError[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: [err("root", "puzzle must be a plain object")] };
  }

  const p = raw as Record<string, unknown>;

  // ── Required string fields ──────────────────────���───────────────────────────
  for (const field of ["id", "level", "title", "difficulty", "category"] as const) {
    if (typeof p[field] !== "string" || !(p[field] as string).trim()) {
      errors.push(err(field, `"${field}" is required and must be a non-empty string`));
    }
  }

  if (typeof p.id === "string" && !/^[a-zA-Z0-9_-]+$/.test(p.id)) {
    errors.push(err("id", "id must be alphanumeric with dashes/underscores only"));
  }

  if (
    typeof p.level === "string" &&
    !(SPEC_LEVELS as readonly string[]).includes(p.level)
  ) {
    errors.push(err("level", `"${p.level}" is not an allowed level`));
  }

  if (
    typeof p.difficulty === "string" &&
    !(SPEC_DIFFICULTIES as readonly string[]).includes(p.difficulty)
  ) {
    errors.push(err("difficulty", `"${p.difficulty}" must be easy, medium, or hard`));
  }

  if (
    typeof p.category === "string" &&
    !(SPEC_CATEGORIES as readonly string[]).includes(p.category)
  ) {
    errors.push(err("category", `"${p.category}" is not an allowed category`));
  }

  // ── variable ───────────────────────��────────────────────────────────���───────
  if (p.variable !== null && p.variable !== undefined) {
    if (typeof p.variable !== "object") {
      errors.push(err("variable", "must be null or an object"));
    } else {
      const v = p.variable as Record<string, unknown>;
      for (const f of ["name", "valueExpression", "valueDisplay"]) {
        if (typeof v[f] !== "string") {
          errors.push(err(`variable.${f}`, "must be a string"));
        }
      }
    }
  }

  // ── answer ─────────────────────────────────────────────────────────────────���
  if (typeof p.answer !== "object" || p.answer === null) {
    errors.push(err("answer", "must be an object"));
  } else {
    const a = p.answer as Record<string, unknown>;

    if (typeof a.expression !== "string") errors.push(err("answer.expression", "must be a string"));
    if (typeof a.display !== "string")    errors.push(err("answer.display", "must be a string"));
    if (typeof a.length !== "number")     errors.push(err("answer.length", "must be a number"));

    if (!Array.isArray(a.cells)) {
      errors.push(err("answer.cells", "must be an array"));
    } else {
      const shownTokens = Array.isArray(p.shownTokens) ? (p.shownTokens as string[]) : [];
      const shownBlocks = Array.isArray(p.shownBlocks) ? (p.shownBlocks as string[]) : [];

      a.cells.forEach((cell, i) => {
        errors.push(...validateCell(cell, i, shownTokens, shownBlocks));
      });

      if (typeof a.length === "number" && a.length !== a.cells.length) {
        errors.push(
          err("answer.length", `declared length ${a.length} does not match cells.length ${a.cells.length}`)
        );
      }
    }
  }

  // ── rules ─────────────────────────���─────────────────────────────────────────
  if (typeof p.rules !== "object" || p.rules === null) {
    errors.push(err("rules", "must be an object (use {} for defaults)"));
  }

  // ── shownTokens ─────────────────���──────────────────────────────────���────────
  if (!Array.isArray(p.shownTokens)) {
    errors.push(err("shownTokens", "must be an array"));
  } else {
    (p.shownTokens as unknown[]).forEach((t, i) => {
      if (typeof t !== "string") {
        errors.push(err(`shownTokens[${i}]`, "must be a string"));
      }
    });
  }

  // ── shownBlocks ───────────────────────────────���─────────────────────────────
  if (!Array.isArray(p.shownBlocks)) {
    errors.push(err("shownBlocks", "must be an array"));
  } else {
    (p.shownBlocks as unknown[]).forEach((b, i) => {
      if (typeof b !== "string") {
        errors.push(err(`shownBlocks[${i}]`, "must be a string"));
      } else if (!(RESERVED_BLOCKS as readonly string[]).includes(b)) {
        errors.push(err(`shownBlocks[${i}]`, `"${b}" is not a reserved block`));
      }
    });
  }

  return { ok: errors.length === 0, errors };
}

/** Validate an array of raw puzzle objects, returning per-puzzle results */
export function validatePuzzleArray(
  items: unknown[]
): Array<{ index: number; id: string | null; result: SpecValidationResult }> {
  return items.map((item, index) => {
    const id =
      typeof item === "object" && item !== null && "id" in item
        ? String((item as Record<string, unknown>).id)
        : null;
    return { index, id, result: validatePuzzleSpec(item) };
  });
}
