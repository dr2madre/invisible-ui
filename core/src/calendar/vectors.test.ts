import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { extendRange, inRange, isWithinRange, monthMatrix, weekdayOrder } from "./state";
import type { WeekStart } from "./types";
import vectors from "./__vectors__/calendar.json";
import names from "./__vectors__/calendar-names.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// files, so both implementations answer the same cases.

/** A connected calendar, recording where it sends focus. */
function calendar(focused: string, weekStartsOn: number, min?: string | null, max?: string | null) {
  const moves: string[] = [];
  const api = connect({
    state: {
      value: null,
      focusedDate: focused,
      view: "month",
      weekStartsOn: weekStartsOn as WeekStart,
      min: min ?? null,
      max: max ?? null,
      id: "vectors",
    },
    setValue: () => {},
    setFocus: (iso) => moves.push(iso),
    setView: () => {},
  });
  return { api, moves };
}

describe("calendar grid vectors", () => {
  for (const { year, month, weekStartsOn, first, last, weekdays } of vectors.grid) {
    it(`${year}-${month} from weekday ${weekStartsOn}`, () => {
      const weeks = monthMatrix(year, month, weekStartsOn as WeekStart);
      expect(weeks).toHaveLength(6);
      expect(weeks[0]![0]!.date).toBe(first);
      expect(weeks[5]![6]!.date).toBe(last);
      expect(weekdayOrder(weekStartsOn as WeekStart)).toEqual(weekdays);
    });
  }
});

describe("calendar keyboard vectors", () => {
  for (const vector of vectors.keyboard) {
    it(vector.name, () => {
      const { api, moves } = calendar(vector.focused, vector.weekStartsOn, vector.min, vector.max);
      const onKeyDown = api.getDayProps(vector.focused).onKeyDown as (event: unknown) => void;
      onKeyDown({ key: vector.key, shiftKey: vector.shift ?? false, preventDefault() {} });
      expect(moves.at(-1)).toBe(vector.expect);
    });
  }
});

describe("calendar step vectors", () => {
  for (const vector of vectors.steps) {
    it(`${vector.focused} by ${vector.direction}`, () => {
      const { api, moves } = calendar(vector.focused, 1, vector.min, vector.max);
      if (vector.direction === 1) api.goNext();
      else api.goPrev();
      expect(moves.at(-1)).toBe(vector.expect);
    });
  }
});

describe("calendar selection vectors", () => {
  for (const { date, min, max, expect: expected } of vectors.selectable) {
    it(`${date} in [${min}, ${max}]`, () => {
      expect(inRange(date, min, max)).toBe(expected);
    });
  }
  for (const { start, end, picked, expect: expected } of vectors.range) {
    it(`${picked} extends ${start} to ${end}`, () => {
      expect(extendRange({ start, end }, picked)).toEqual(expected);
    });
  }
  for (const { start, end, date, expect: expected } of vectors.within) {
    it(`${date} within ${start} to ${end}`, () => {
      expect(isWithinRange({ start, end }, date)).toBe(expected);
    });
  }
});

/* ------------------------------------------------------------------ *
 * Names. The table is the project's own, the one the Flutter adapter
 * carries. Rendering a case from it must give what Intl gives for the same
 * Gregorian date. The formatter reads the date in UTC, so the runner's time
 * zone plays no part.
 * ------------------------------------------------------------------ */

interface Entry {
  digits: string[];
  hourCycle: number;
  weekdays: Record<"long" | "short" | "narrow", string[]>;
  months: Record<Style, string[] | null>;
  patterns: Record<Style, string>;
}
type Style = "day" | "title" | "medium";

const OPTIONS: Record<Style, Intl.DateTimeFormatOptions> = {
  day: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  title: { month: "long", year: "numeric" },
  medium: { dateStyle: "medium" },
};

function render(entry: Entry, style: Style, iso: string): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const digits = (n: number, width = 1) =>
    String(n)
      .padStart(width, "0")
      .replace(/\d/g, (c) => entry.digits[Number(c)]!);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const months = entry.months[style];
  return entry.patterns[style].replace(/\{(EEEE|dd|d|MMMM|MM|M|y)\}/g, (_, token: string) => {
    switch (token) {
      case "EEEE":
        return entry.weekdays.long[weekday]!;
      case "dd":
        return digits(d, 2);
      case "d":
        return digits(d);
      case "MMMM":
        return months![m - 1]!;
      case "MM":
        return digits(m, 2);
      case "M":
        return digits(m);
      default:
        return digits(y);
    }
  });
}

// A runtime may print U+202F where the table has a plain space.
const normalize = (text: string) => text.replace(/\u202f/g, " ");

describe("calendar name vectors", () => {
  const table: Record<string, Entry> = names.locales;
  for (const { locale, style, date, expect: expected } of names.cases) {
    it(`${locale} ${style} ${date}`, () => {
      expect(render(table[locale]!, style as Style, date)).toBe(expected);
      const [y, m, d] = date.split("-").map(Number) as [number, number, number];
      const intl = new Intl.DateTimeFormat(locale, {
        ...OPTIONS[style as Style],
        calendar: "gregory",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(y, m - 1, d)));
      expect(normalize(intl)).toBe(expected);
    });
  }
  for (const [locale, entry] of Object.entries(table)) {
    it(`${locale} weekday names and hour cycle match Intl`, () => {
      for (const width of ["long", "short", "narrow"] as const) {
        const format = new Intl.DateTimeFormat(locale, { weekday: width, timeZone: "UTC" });
        // 2024-01-07 is a Sunday.
        const runtime = Array.from({ length: 7 }, (_, i) =>
          format.format(new Date(Date.UTC(2024, 0, 7 + i))),
        );
        expect(runtime).toEqual(entry.weekdays[width]);
      }
      const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions()
        .hourCycle;
      expect(cycle === "h11" || cycle === "h12" ? 12 : 24).toBe(entry.hourCycle);
    });
  }
});
