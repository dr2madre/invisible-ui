import { describe, expect, it } from "vitest";
import { numberSymbols } from "../i18n/format";
import {
  canonicalString,
  decimalsOf,
  formatNumber,
  parseNumber,
  snapToStep,
  validate,
} from "./state";
import vectors from "./__vectors__/number-field.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("number-field symbol vectors", () => {
  for (const [locale, symbols] of Object.entries(vectors.symbols)) {
    it(locale, () => {
      expect(numberSymbols(locale)).toEqual(symbols);
    });
  }
});

describe("number-field parse vectors", () => {
  for (const vector of vectors.parse) {
    it(`${vector.locale} ${JSON.stringify(vector.text).slice(0, 40)}`, () => {
      expect(parseNumber(vector.text, vector.locale)).toEqual(vector.expect);
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
      expect(formatNumber(value, locale)).toBe(expected);
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
