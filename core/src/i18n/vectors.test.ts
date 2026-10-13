import { describe, expect, it } from "vitest";
import { forLocale } from "../calendar/week-start";
import { hourCycleOf } from "./format";
import { DEFAULT_LOCALE, localeDirection, resolveLocale } from "./locale";
import vectors from "./__vectors__/locale-direction.json";
import defaults from "./__vectors__/default-locale.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("locale direction vectors", () => {
  for (const vector of vectors.directions) {
    it(`${vector.locale} is ${vector.expect}`, () => {
      expect(localeDirection(vector.locale)).toBe(vector.expect);
    });
  }
});

describe("default locale vectors", () => {
  for (const { app, context, source, weekStart, hourCycle } of defaults.cases) {
    it(`app ${app}, context ${context}: ${source}`, () => {
      const locale = resolveLocale(app, context);
      const decided = { default: DEFAULT_LOCALE, context, app }[source];
      expect(locale).toBe(resolveLocale(decided));
      expect(forLocale(locale)).toBe(weekStart);
      expect(hourCycleOf(locale)).toBe(hourCycle);
    });
  }
});
