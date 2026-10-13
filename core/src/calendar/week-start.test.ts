import { describe, expect, it } from "vitest";
import { forLocale, table } from "./week-start";
import vectors from "./__vectors__/week-start.json";

// The Flutter adapter reads the same file, so both carry the same table and
// answer the same cases.

describe("weekStart.forLocale", () => {
  it("carries the shared table", () => {
    const byRegion: Record<string, number> = {};
    for (const [day, regions] of Object.entries(vectors.firstDay.byRegion)) {
      for (const region of regions) byRegion[region] = Number(day);
    }
    expect(table.firstDayByRegion).toEqual(byRegion);
    expect(table.likelyRegion).toEqual(vectors.firstDay.likelyRegion);
  });

  for (const { locale, firstDay } of vectors.cases) {
    it(`"${locale}" starts on ${firstDay}`, () => {
      expect(forLocale(locale)).toBe(firstDay);
    });
  }
});
