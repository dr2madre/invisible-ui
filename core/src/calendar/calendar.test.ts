import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import {
  addDays,
  addMonths,
  daysInMonth,
  initialState,
  monthMatrix,
  monthsOfYear,
  rangeDays,
  startOfWeek,
  weekdayOrder,
} from "./state";
import type { CalendarState } from "./types";

describe("calendar date helpers", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2024-01-31", 1)).toBe("2024-02-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29"); // leap year
  });

  it("adds months and clamps to the last valid day", () => {
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2024-12-15", 1)).toBe("2025-01-15");
    expect(addMonths("2024-03-31", -1)).toBe("2024-02-29");
  });

  it("knows month lengths incl. leap years", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2024, 4)).toBe(30);
  });

  it("computes the start of the week for a given first weekday", () => {
    // 2024-06-12 is a Wednesday.
    expect(startOfWeek("2024-06-12", 1)).toBe("2024-06-10"); // Monday
    expect(startOfWeek("2024-06-12", 0)).toBe("2024-06-09"); // Sunday
  });

  it("orders weekday indices from the configured start", () => {
    expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe("calendar matrix builders", () => {
  it("builds a 6×7 month grid that starts on the configured weekday", () => {
    const weeks = monthMatrix(2024, 6, 1); // June 2024, Monday start
    expect(weeks).toHaveLength(6);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0]![0]!.date).toBe("2024-05-27"); // Monday before June 1
    expect(weeks[0]!.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it("builds N consecutive days", () => {
    const days = rangeDays("2024-06-12", 3);
    expect(days.map((d) => d.date)).toEqual(["2024-06-12", "2024-06-13", "2024-06-14"]);
  });

  it("lists the 12 months of a year", () => {
    const months = monthsOfYear(2024);
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ year: 2024, month: 1 });
    expect(months[11]).toEqual({ year: 2024, month: 12 });
  });
});

describe("calendar connect", () => {
  const base = (over: Partial<CalendarState> = {}): CalendarState => ({
    ...initialState({ focusedDate: "2024-06-12", value: null }),
    ...over,
  });

  const harness = (state: CalendarState) => {
    const calls = { value: [] as string[], focus: [] as string[] };
    const api = connect({
      state,
      setValue: (v) => calls.value.push(v),
      setFocus: (v) => calls.focus.push(v),
      setView: () => {},
    });
    return { api, calls };
  };

  it("steps by one month for the month view", () => {
    const { api, calls } = harness(base({ view: "month" }));
    api.goNext();
    api.goPrev();
    expect(calls.focus).toEqual(["2024-07-12", "2024-05-12"]);
  });

  it("steps by a week / three days / a day for the day-range views", () => {
    expect(stepFocus(base({ view: "week" }))).toBe("2024-06-19");
    expect(stepFocus(base({ view: "three-day" }))).toBe("2024-06-15");
    expect(stepFocus(base({ view: "day" }))).toBe("2024-06-13");
  });

  it("does not select dates outside [min, max]", () => {
    const { api, calls } = harness(base({ min: "2024-06-10", max: "2024-06-20" }));
    api.setValue("2024-06-25");
    expect(calls.value).toEqual([]);
    api.setValue("2024-06-15");
    expect(calls.value).toEqual(["2024-06-15"]);
    expect(api.isSelectable("2024-06-09")).toBe(false);
  });

  it("clamps keyboard focus movement into range", () => {
    const focused: string[] = [];
    const api = connect({
      state: base({ focusedDate: "2024-06-10", min: "2024-06-10", max: "2024-06-20" }),
      setValue: () => {},
      setFocus: (v) => focused.push(v),
      setView: () => {},
    });
    const ev = { key: "ArrowUp", preventDefault: vi.fn(), shiftKey: false } as unknown as Event;
    (api.getDayProps("2024-06-10").onKeyDown as (e: Event) => void)(ev);
    expect(focused).toEqual(["2024-06-10"]); // -7 days clamped back to min
  });

  it("marks the focused day as the roving tab stop", () => {
    const { api } = harness(base({ focusedDate: "2024-06-12" }));
    expect(api.getDayProps("2024-06-12").tabindex).toBe(0);
    expect(api.getDayProps("2024-06-13").tabindex).toBe(-1);
  });
});

function stepFocus(state: CalendarState): string {
  const focused: string[] = [];
  const api = connect({
    state,
    setValue: () => {},
    setFocus: (v) => focused.push(v),
    setView: () => {},
  });
  api.goNext();
  return focused[0]!;
}
