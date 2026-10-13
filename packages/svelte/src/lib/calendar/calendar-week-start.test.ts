import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { calendar } from "@design-system/core";
import Fixture from "./calendar-week-start.fixture.svelte";

/** The long weekday name the first column carries (0 = Sunday). */
const firstWeekdayName = (locale: string, weekday: number) =>
  new Intl.DateTimeFormat(locale, { weekday: "long" }).format(calendar.weekdayDate(weekday));

const firstColumn = () => screen.getAllByRole("columnheader")[0]!.getAttribute("aria-label");
// June 2026 starts on a Monday: the first cell tells which day starts the week.
const firstCell = () => document.querySelector<HTMLElement>(".calendar__day")!.dataset.date;

describe("Svelte Calendar (week start from the locale)", () => {
  it("starts on Sunday for en and en-US", async () => {
    const { rerender } = render(Fixture, { props: { locale: "en" } });
    expect(firstColumn()).toBe("Sunday");
    expect(firstCell()).toBe("2026-05-31");

    await rerender({ locale: "en-US" });
    expect(firstColumn()).toBe("Sunday");
  });

  it("starts on Monday for it-IT", () => {
    render(Fixture, { props: { locale: "it-IT" } });
    expect(firstColumn()).toBe(firstWeekdayName("it-IT", 1));
    expect(firstCell()).toBe("2026-06-01");
  });

  it("starts on Saturday for ar-EG", () => {
    render(Fixture, { props: { locale: "ar-EG" } });
    expect(firstColumn()).toBe(firstWeekdayName("ar-EG", 6));
    expect(firstCell()).toBe("2026-05-30");
  });

  it("follows a locale change", async () => {
    const { rerender } = render(Fixture, { props: { locale: "en-US" } });
    await rerender({ locale: "it-IT" });
    expect(firstCell()).toBe("2026-06-01");
  });

  it("lets the prop override the locale", () => {
    render(Fixture, { props: { locale: "en-US", weekStartsOn: 1 } });
    expect(firstColumn()).toBe("Monday");
    expect(firstCell()).toBe("2026-06-01");
  });
});
