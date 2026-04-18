/**
 * lib/puzzles/puzzle-adapter.ts
 * Re-exports finalized adapter from @mathdle/core.
 * This file is the swap point for the web app — nothing else needs to change.
 */
export {
  adaptPuzzle,
  mapPuzzleDbRowToDomain,
  mapPuzzleDomainToViewModel,
  buildKeypadGroups,
  extractValidationContext,
} from "@mathdle/core";

// Keep old export name for backward compat during transition
export { mapPuzzleDbRowToDomain as adaptPuzzleTransport } from "@mathdle/core";
