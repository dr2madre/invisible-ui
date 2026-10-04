import { render } from "@testing-library/vue";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Calendar } from "./Calendar";
import type { CalendarView } from "./use-calendar";

// Weekday and month names must not depend on the time zone. A date at UTC
// midnight is the previous day west of UTC, so a name formatted from it
// shifts by one there. Each zone pairs with its own locale: the shared
// formatter cache keeps the zone a formatter was created in.
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const zones = [
  { zone: "America/Los_Angeles", locale: "en-US" },
  { zone: "Pacific/Auckland", locale: "en-NZ" },
];

const texts = (selector: string) =>
  [...document.querySelectorAll(selector)].map((node) => node.textContent?.trim());

describe.each(zones)("Vue Calendar names in $zone", ({ zone, locale }) => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = zone;
  });
  afterAll(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });

  const renderCalendar = (view: CalendarView) =>
    render(Calendar, {
      props: { value: "2026-06-15", focusedDate: "2026-06-15", weekStartsOn: 0, view, locale },
    });

  it("labels the weekday headers with the right day", () => {
    renderCalendar("month");
    const headers = [...document.querySelectorAll(".calendar__weekdays [role='columnheader']")];
    expect(headers.map((cell) => cell.getAttribute("aria-label"))).toEqual(WEEKDAYS);
    expect(headers.map((cell) => cell.textContent)).toEqual(WEEKDAYS.map((d) => d.slice(0, 3)));
  });

  it("names a day by its own weekday", () => {
    renderCalendar("month");
    const day = document.querySelector('[data-date="2026-06-15"]');
    expect(day?.getAttribute("aria-label")).toMatch(/^Monday, /);
  });

  it("titles each month of the two-month view", () => {
    renderCalendar("two-month");
    expect(texts(".calendar__month-title")).toEqual(["June 2026", "July 2026"]);
  });

  it("names every month of the year view", () => {
    renderCalendar("year");
    expect(texts(".calendar__mini-title")).toEqual(MONTHS);
  });
});
