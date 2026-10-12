import { foldDigitsWith, type NumberSymbols } from "../i18n/format";
import { foldArabicDigits } from "../internal/digits";
import type { NumberParseResult } from "./types";

// Group separators typed with a plain or non-breaking space must all count
// as the locale's space grouping, because keyboards produce different spaces.
// A locale that groups with an apostrophe, such as de-CH, takes both the
// typographic one it displays and the straight one keyboards type.
const APOSTROPHE_GROUPS = ["’", "'"];
const SPACE_GROUPS = [" ", " ", " ", " "];

function groupsOf(group: string): readonly string[] {
  if (/\s/.test(group)) return SPACE_GROUPS;
  return APOSTROPHE_GROUPS.includes(group) ? APOSTROPHE_GROUPS : [group];
}

/**
 * Parse an editing string against explicit number symbols. The grammar lives
 * here, apart from any locale lookup, so it answers the same on every
 * platform; `parseNumber` feeds it the symbols the runtime reports for a
 * locale. Accepted transients: empty, a lone sign, a lone decimal separator,
 * and digits with a trailing decimal separator.
 */
export function parseWithSymbols(text: string, symbols: NumberSymbols): NumberParseResult {
  const trimmed = text.trim();
  if (trimmed === "") return { status: "empty", value: null, error: null };

  // Formatters emit invisible direction marks around RTL numbers: they must
  // never make a pasted or reformatted value unparseable. Arabic-Indic and
  // Persian digits fold in every locale, besides the locale's own.
  let s = foldArabicDigits(foldDigitsWith(trimmed.replace(/[؜‎‏⁦-⁩]/g, ""), symbols.digits));

  for (const group of groupsOf(symbols.group)) s = s.split(group).join("");
  if (symbols.minusSign !== "-") s = s.split(symbols.minusSign).join("-");
  // The typographic minus sign folds to the ASCII hyphen too.
  s = s.split("−").join("-");
  if (symbols.decimal !== ".") s = s.split(symbols.decimal).join(".");

  if (/^[-+]$/.test(s) || /^[-+]?\.$/.test(s)) {
    return { status: "incomplete", value: null, error: null };
  }
  const complete = /^[-+]?(\d+(\.\d+)?|\.\d+)$/.test(s);
  const trailingSeparator = /^[-+]?\d+\.$/.test(s);
  if (!complete && !trailingSeparator) {
    return { status: "invalid", value: null, error: "parse" };
  }
  const value = Number(s);
  if (!Number.isFinite(value)) {
    return { status: "invalid", value: null, error: "parse" };
  }
  return {
    status: trailingSeparator ? "incomplete" : "valid",
    value: Object.is(value, -0) ? 0 : value,
    error: null,
  };
}
