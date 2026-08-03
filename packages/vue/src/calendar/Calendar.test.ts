import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Calendar, type CalendarEvent } from "./Calendar";

const noAxeRegion = { rules: { region: { enabled: false } } };

// Every render pins the date, so nothing depends on the day the suite runs.
const events: CalendarEvent[] = [
  { date: "2026-06-10", label: "Standup", tone: "primary" },
  { date: "2026-06-10", label: "Lunch", tone: "success" },
  { date: "2026-06-18", label: "Review", tone: "warning" },
];
const prices: Record<string, string> = {
  "2026-06-12": "€120",
  "2026-06-13": "€90",
};

const renderCalendar = (props: Record<string, unknown> = {}) =>
  render(Calendar, {
    props: {
      value: "2026-06-15",
      focusedDate: "2026-06-15",
      events,
      prices,
      locale: "en-US",
      ...props,
    },
  });

const grid = () => screen.getByRole("grid", { name: "Calendar" });
const dayButton = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe("Vue Calendar (month view)", () => {
  it("renders the period title and a 6x7 day grid", () => {
    renderCalendar();
    expect(screen.getByRole("heading", { name: /June 2026/i })).toBeInTheDocument();
    expect(grid().querySelectorAll(".calendar__day")).toHaveLength(42);
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("marks the selected day and flags days outside the month", () => {
    renderCalendar();
    expect(dayButton("2026-06-15")).toHaveAttribute("data-selected", "");
    // June 2026 starts on a Monday, so the grid's trailing days spill into July.
    expect(dayButton("2026-07-01")).toHaveClass("calendar__day--outside");
  });

  it("selects a day on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCalendar({ onValueChange });
    await user.click(dayButton("2026-06-20"));
    expect(onValueChange).toHaveBeenCalledWith("2026-06-20");
    expect(dayButton("2026-06-20")).toHaveAttribute("data-selected", "");
  });

  it("emits update:modelValue so the date binds with v-model", async () => {
    const user = userEvent.setup();
    const { emitted } = render(Calendar, {
      props: { modelValue: "2026-06-15", focusedDate: "2026-06-15", locale: "en-US" },
    });
    await user.click(dayButton("2026-06-20"));
    expect(emitted()["update:modelValue"]).toEqual([["2026-06-20"]]);
  });

  it("shows appointment dots and a price per day", () => {
    renderCalendar();
    expect(dayButton("2026-06-10").querySelectorAll(".calendar__dot")).toHaveLength(2);
    expect(dayButton("2026-06-12")).toHaveTextContent("€120");
    // The accessible name carries the event count and the price.
    expect(dayButton("2026-06-10")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("2 events"),
    );
    expect(dayButton("2026-06-12")).toHaveAttribute("aria-label", expect.stringContaining("€120"));
  });

  it("renders the day slot in place of the default content", () => {
    render(Calendar, {
      props: { value: "2026-06-15", focusedDate: "2026-06-15", locale: "en-US" },
      slots: { day: (slotProps: { date: string }) => slotProps.date.slice(-2) },
    });
    expect(dayButton("2026-06-20")).toHaveTextContent("20");
    expect(dayButton("2026-06-20").querySelector(".calendar__daynum")).toBeNull();
  });

  it("navigates months with the prev/next buttons", async () => {
    const user = userEvent.setup();
    renderCalendar();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /July 2026/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("heading", { name: /May 2026/i })).toBeInTheDocument();
  });

  it("jumps back to today", async () => {
    const user = userEvent.setup();
    const onFocusChange = vi.fn();
    renderCalendar({ onFocusChange });
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(onFocusChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });

  it("uses a roving tab stop on the focused day and moves it with arrow keys", async () => {
    const user = userEvent.setup();
    renderCalendar();
    expect(dayButton("2026-06-15")).toHaveAttribute("tabindex", "0");
    expect(dayButton("2026-06-16")).toHaveAttribute("tabindex", "-1");

    dayButton("2026-06-15").focus();
    await user.keyboard("{ArrowRight}");
    expect(dayButton("2026-06-16")).toHaveAttribute("tabindex", "0");
    expect(dayButton("2026-06-15")).toHaveAttribute("tabindex", "-1");
    expect(dayButton("2026-06-16")).toHaveFocus();
  });

  it("moves a week with ArrowDown/ArrowUp and to the week edges with Home/End", async () => {
    const user = userEvent.setup();
    renderCalendar();
    dayButton("2026-06-15").focus();

    await user.keyboard("{ArrowDown}");
    expect(dayButton("2026-06-22")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(dayButton("2026-06-15")).toHaveFocus();
    await user.keyboard("{End}"); // Monday-start week: Sunday the 21st
    expect(dayButton("2026-06-21")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(dayButton("2026-06-15")).toHaveFocus();
  });

  it("steps a month with PageDown/PageUp and a year with Shift", async () => {
    const user = userEvent.setup();
    renderCalendar();
    dayButton("2026-06-15").focus();

    await user.keyboard("{PageDown}");
    expect(screen.getByRole("heading", { name: /July 2026/i })).toBeInTheDocument();
    await user.keyboard("{PageUp}");
    expect(screen.getByRole("heading", { name: /June 2026/i })).toBeInTheDocument();
    await user.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(screen.getByRole("heading", { name: /June 2027/i })).toBeInTheDocument();
  });

  it("selects the focused day with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCalendar({ onValueChange });
    dayButton("2026-06-15").focus();
    await user.keyboard("{ArrowRight}");
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("2026-06-16");
  });

  it("disables and refuses dates outside [min, max]", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCalendar({ min: "2026-06-10", max: "2026-06-20", onValueChange });
    expect(dayButton("2026-06-05")).toHaveAttribute("data-disabled", "");
    await user.click(dayButton("2026-06-05"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("renders month and weekday names in the given locale", () => {
    renderCalendar({ locale: "it-IT" });
    expect(screen.getByRole("heading", { name: /giugno 2026/i })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderCalendar();
    expect(await axe(container, noAxeRegion)).toHaveNoViolations();
  });
});

describe("Vue Calendar (two-month view)", () => {
  it("renders two month grids side by side without duplicate day ids", () => {
    renderCalendar({ view: "two-month" });
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(dayButton("2026-06-15")).toBeInTheDocument();
    expect(dayButton("2026-07-20")).toBeInTheDocument();
    // July 1 appears once, as July's in-month day, never as June's spillover.
    expect(document.querySelectorAll('[data-date="2026-07-01"]')).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /June\s*–\s*July 2026/i })).toBeInTheDocument();
  });

  it("steps one month at a time", async () => {
    const user = userEvent.setup();
    renderCalendar({ view: "two-month" });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /July\s*–\s*August 2026/i })).toBeInTheDocument();
  });
});

describe("Vue Calendar (agenda views)", () => {
  it("week view shows 7 day columns with their events", () => {
    renderCalendar({ view: "week" });
    // Monday-start week containing 2026-06-15 runs 2026-06-15 to 2026-06-21.
    expect(dayButton("2026-06-15")).toBeInTheDocument();
    expect(dayButton("2026-06-21")).toBeInTheDocument();
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(7);
    expect(dayButton("2026-06-18").parentElement).toHaveTextContent("Review");
  });

  it("three-day view shows 3 columns starting at the focused day", () => {
    renderCalendar({ view: "three-day", focusedDate: "2026-06-12", value: null });
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(3);
    expect(dayButton("2026-06-12")).toBeInTheDocument();
    expect(dayButton("2026-06-14")).toBeInTheDocument();
    expect(dayButton("2026-06-12").parentElement).toHaveTextContent("€120");
  });

  it("day view shows a single column and the full date title", () => {
    renderCalendar({ view: "day", focusedDate: "2026-06-15" });
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /Monday, June 15, 2026/i })).toBeInTheDocument();
  });

  it("week view steps forward by 7 days", async () => {
    const user = userEvent.setup();
    renderCalendar({ view: "week", focusedDate: "2026-06-15", value: null });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(dayButton("2026-06-22")).toBeInTheDocument();
    expect(document.querySelector('[data-date="2026-06-15"]')).toBeNull();
  });

  it("has no accessibility violations in week view", async () => {
    const { container } = renderCalendar({ view: "week" });
    expect(await axe(container, noAxeRegion)).toHaveNoViolations();
  });
});

describe("Vue Calendar (year view)", () => {
  it("renders 12 mini-months and the year title", () => {
    renderCalendar({ view: "year", focusedDate: "2026-06-15" });
    expect(screen.getByRole("heading", { name: "2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("grid")).toHaveLength(12);
    expect(dayButton("2026-01-15")).toBeInTheDocument();
    expect(dayButton("2026-12-25")).toBeInTheDocument();
    expect(dayButton("2026-06-15")).toHaveAttribute("data-selected", "");
  });

  it("jumps to the month view when a month title is clicked", async () => {
    const user = userEvent.setup();
    renderCalendar({ view: "year", focusedDate: "2026-06-15" });
    await user.click(screen.getByRole("button", { name: "January" }));
    expect(screen.getByRole("grid", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /January 2026/i })).toBeInTheDocument();
  });

  it("steps a whole year with next", async () => {
    const user = userEvent.setup();
    renderCalendar({ view: "year", focusedDate: "2026-06-15" });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "2027" })).toBeInTheDocument();
    expect(dayButton("2027-03-10")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderCalendar({ view: "year" });
    expect(await axe(container, noAxeRegion)).toHaveNoViolations();
  });
});

describe("Vue Calendar (view switcher)", () => {
  it("switches view via the segmented control", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    renderCalendar({
      views: ["month", "week", "day"],
      view: "month",
      focusedDate: "2026-06-15",
      onViewChange,
    });
    expect(screen.getByRole("grid", { name: "Calendar" })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Day" }));
    expect(onViewChange).toHaveBeenCalledWith("day");
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(1);
  });

  it("shows no switcher with a single view", () => {
    renderCalendar();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });
});

describe("Vue Calendar (range mode)", () => {
  it("marks the endpoints and the days between", () => {
    renderCalendar({
      mode: "range",
      rangeStart: "2026-06-10",
      rangeEnd: "2026-06-15",
      value: null,
    });
    expect(dayButton("2026-06-10")).toHaveAttribute("data-range-start", "");
    expect(dayButton("2026-06-15")).toHaveAttribute("data-range-end", "");
    expect(dayButton("2026-06-12")).toHaveAttribute("data-in-range", "");
    expect(dayButton("2026-06-16")).not.toHaveAttribute("data-in-range");
  });

  it("completes a range across two clicks", async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    renderCalendar({ mode: "range", value: null, onRangeChange });

    await user.click(dayButton("2026-06-10"));
    expect(onRangeChange).toHaveBeenLastCalledWith("2026-06-10", null);
    await user.click(dayButton("2026-06-15"));
    expect(onRangeChange).toHaveBeenLastCalledWith("2026-06-10", "2026-06-15");
  });

  it("swaps the endpoints when the second click lands before the first", async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    renderCalendar({ mode: "range", rangeStart: "2026-06-15", value: null, onRangeChange });
    await user.click(dayButton("2026-06-10"));
    expect(onRangeChange).toHaveBeenLastCalledWith("2026-06-10", "2026-06-15");
  });

  it("restarts the range when both ends are already set", async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    renderCalendar({
      mode: "range",
      rangeStart: "2026-06-10",
      rangeEnd: "2026-06-15",
      value: null,
      onRangeChange,
    });
    await user.click(dayButton("2026-06-20"));
    expect(onRangeChange).toHaveBeenLastCalledWith("2026-06-20", null);
  });
});
