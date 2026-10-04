import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { localDate, monthDate, weekdayDate } from "./state";

// The Intl formatters read a Date in the local time zone, so the dates built
// for them must fall on the same calendar day on both sides of UTC.
describe.each(["America/Los_Angeles", "Pacific/Auckland"])("local dates in %s", (zone) => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = zone;
  });
  afterAll(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });

  const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", options).format(date);

  it("names each weekday from its index", () => {
    const names = [0, 1, 2, 3, 4, 5, 6].map((d) => format(weekdayDate(d), { weekday: "long" }));
    expect(names).toEqual([
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);
  });

  it("names a month from its number", () => {
    expect(format(monthDate(2026, 1), { month: "long", year: "numeric" })).toBe("January 2026");
    expect(format(monthDate(2026, 6), { month: "long" })).toBe("June");
  });

  it("keeps an ISO date on its own day", () => {
    const date = localDate("2026-06-15");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 5, 15]);
    expect(format(date, { weekday: "long" })).toBe("Monday");
  });
});
