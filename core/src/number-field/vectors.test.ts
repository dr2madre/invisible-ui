import { describe, expect, it } from "vitest";
import { numberSymbols, type NumberSymbols } from "../i18n/format";
import { parseWithSymbols } from "./parse";
import { canonicalString, decimalsOf, formatNumber, snapToStep, validate } from "./state";
import vectors from "./__vectors__/number-field.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.
//
// The symbol table in the file is the project's own, the one the Flutter
// adapter carries. The expectations never read the runtime's Intl data: its
// CLDR release moves with the Node or browser version (de-CH switched its
// group separator from U+2019 to U+0027 in CLDR 47), and a test must answer
// the same on every machine.

type Symbols = NumberSymbols;
const table = vectors.symbols as Record<string, Symbols>;

/** The table's symbols for a tag: language and region, then language, then
 *  English, the same fallback as the Flutter adapter's `NumberSymbols`. */
function tableSymbols(tag: string): Symbols {
  const [language, region] = tag.split("-");
  return table[`${language}-${region}`] ?? table[language!] ?? table.en!;
}

/**
 * Rewrite text the runtime formatted with its own symbols into the table's
 * symbols, one character at a time so swapped separators stay apart.
 */
function toTable(text: string, locale: string): string {
  const runtime = numberSymbols(locale);
  const target = tableSymbols(locale);
  const map = new Map<string, string>();
  for (let n = 0; n < 10; n++) map.set(runtime.digits[n]!, target.digits[n]!);
  map.set(runtime.decimal, target.decimal);
  map.set(runtime.group, target.group);
  map.set(runtime.minusSign, target.minusSign);
  let out = "";
  for (const char of text) out += map.get(char) ?? char;
  return out;
}

// Symbols a CLDR release has changed: each field lists every value a
// supported runtime may report. Extend it when a new release moves one.
const CLDR_VARIANTS: Record<string, Partial<Record<keyof Symbols, string[]>>> = {
  "de-CH": { group: ["\u2019", "'"] },
};

describe("number-field symbol vectors", () => {
  for (const [locale, symbols] of Object.entries(table)) {
    it(`${locale} reads the table's symbols from Intl, within known CLDR variants`, () => {
      const runtime = numberSymbols(locale);
      const variants = CLDR_VARIANTS[locale] ?? {};
      for (const key of ["decimal", "group", "minusSign"] as const) {
        expect(variants[key] ?? [symbols[key]]).toContain(runtime[key]);
      }
      expect(runtime.digits).toEqual(symbols.digits);
    });
  }
});

describe("number-field parse vectors", () => {
  for (const vector of vectors.parse) {
    it(`${vector.locale} ${JSON.stringify(vector.text).slice(0, 40)}`, () => {
      expect(parseWithSymbols(vector.text, tableSymbols(vector.locale))).toEqual(vector.expect);
    });
  }
});

describe("number-field validate vectors", () => {
  for (const { value, min, max, step, expect: expected } of vectors.validate) {
    it(`${value} in [${min}, ${max}] step ${step}`, () => {
      expect(validate(value, min, max, step)).toBe(expected);
    });
  }
});

describe("number-field step vectors", () => {
  for (const { current, direction, min, max, step, expect: expected } of vectors.snap) {
    it(`${current} by ${direction} in [${min}, ${max}] step ${step}`, () => {
      expect(snapToStep(current, direction as 1 | -1, min, max, step)).toBe(expected);
    });
  }
});

describe("number-field format vectors", () => {
  for (const { locale, value, expect: expected } of vectors.format) {
    it(`${locale} ${value}`, () => {
      // Grouping and rounding come from Intl; the glyphs come from the table.
      expect(toTable(formatNumber(value, locale), locale)).toBe(expected);
    });
  }
  for (const { value, expect: expected } of vectors.canonical) {
    it(`canonical ${value}`, () => {
      expect(canonicalString(value)).toBe(expected);
    });
  }
  for (const { value, expect: expected } of vectors.decimals) {
    it(`decimals of ${value}`, () => {
      expect(decimalsOf(value)).toBe(expected);
    });
  }
});
