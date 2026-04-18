/**
 * Lightweight mathjs stub for React Native / Expo Go.
 *
 * mathjs bundles ~900 files and causes Metro to take 30-60 s on first start.
 * This stub replaces it with a minimal evaluator that covers everything the
 * Mathdle game actually needs:
 *   - arithmetic:  + - * / ^ ( )
 *   - functions:   sqrt abs sin cos tan log log2 log10 floor ceil round
 *   - constants:   pi e
 *   - variables:   passed as a scope object
 *
 * Used via metro.config.js resolver alias.
 */

"use strict";

// ─── Safe expression evaluator ────────────────────────────────────────────────

/**
 * Replace named variables in an expression string, then evaluate with
 * Function() — supported by Hermes in development (Expo Go).
 */
function evaluate(expr, scope) {
  let e = String(expr).trim();

  // Substitute scope variables (whole-word only to avoid partial matches)
  if (scope && typeof scope === "object") {
    for (const [key, val] of Object.entries(scope)) {
      e = e.replace(new RegExp(`\\b${key}\\b`, "g"), String(val));
    }
  }

  // Map mathjs syntax → JS
  e = e
    .replace(/\^/g, "**")
    .replace(/\bsqrt\b/g, "Math.sqrt")
    .replace(/\babs\b/g, "Math.abs")
    .replace(/\bsin\b/g, "Math.sin")
    .replace(/\bcos\b/g, "Math.cos")
    .replace(/\btan\b/g, "Math.tan")
    .replace(/\blog10\b/g, "Math.log10")
    .replace(/\blog2\b/g, "Math.log2")
    .replace(/\blog\b/g, "Math.log")
    .replace(/\bfloor\b/g, "Math.floor")
    .replace(/\bceil\b/g, "Math.ceil")
    .replace(/\bround\b/g, "Math.round")
    .replace(/\bpi\b/g, String(Math.PI))
    .replace(/\be\b/g, String(Math.E));

  // eslint-disable-next-line no-new-func
  return new Function(`"use strict"; return (${e});`)();
}

const math = { evaluate };

function create() {
  return math;
}

const all = {};

module.exports = { create, all, evaluate };
