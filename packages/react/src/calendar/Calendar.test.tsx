import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Calendar, type CalendarEvent, type CalendarProps } from "./Calendar";

const EVENTS: CalendarEvent[] = [
  { date: "2026-06-10", label: "Standup", tone: "primary" },
  { date: "2026-06-10", label: "Lunch", tone: "success" },
  { date: "2026-06-18", label: "Review", tone: "warning" },
];
const PRICES = { "2026-06-12": "€120", "2026-06-13": "€90" };

const Fixture = (props: Partial<CalendarProps>) => (
  <Calendar
    value="2026-06-15"
    focusedDate="2026-06-15"
    weekStartsOn={1}
    events={EVENTS}
    prices={PRICES}
    locale="en-US"
    {...props}
  />
);

const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const cell = (iso: string) => day(iso).closest('[role="gridcell"]');

describe("React Calendar (month view)", () => {
  it("renders the period title and a 6x7 day grid", () => {
    render(<Fixture />);
    expect(screen.getByRole("heading", { name: /June 2026/i })).toBeInTheDocument();
    const grid = screen.getByRole("grid", { name: "Calendar" });
    expect(grid.querySelectorAll(".calendar__day")).toHaveLength(42);
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("marks the selected day and flags days outside the month", () => {
    render(<Fixture />);
    expect(day("2026-06-15")).toHaveAttribute("data-selected", "");
    expect(cell("2026-06-15")).toHaveAttribute("aria-selected", "true");
    expect(day("2026-07-01")).toHaveClass("calendar__day--outside");
  });

  it("selects a day on click and reports it once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onFocusChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} onFocusChange={onFocusChange} />);
    await user.click(day("2026-06-20"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("2026-06-20");
    expect(onFocusChange).toHaveBeenCalledTimes(1);
    expect(day("2026-06-20")).toHaveAttribute("data-selected", "");
    // Picking the selected day again moves nothing, so nothing is reported.
    await user.click(day("2026-06-20"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("shows appointment dots and a price per day, named in the day's label", () => {
    render(<Fixture />);
    expect(day("2026-06-10").querySelectorAll(".calendar__dot")).toHaveLength(2);
    expect(day("2026-06-12")).toHaveTextContent("€120");
    expect(day("2026-06-10")).toHaveAccessibleName("Wednesday, June 10, 2026, 2 events");
    expect(day("2026-06-18")).toHaveAccessibleName("Thursday, June 18, 2026, 1 event");
    expect(day("2026-06-12")).toHaveAccessibleName(expect.stringContaining("€120"));
  });

  it("renders two events of one day that share a label", () => {
    const twin = [
      { date: "2026-06-10", label: "Standup" },
      { date: "2026-06-10", label: "Standup" },
    ];
    render(<Fixture events={twin} />);
    expect(day("2026-06-10").querySelectorAll(".calendar__dot")).toHaveLength(2);
  });

  it("caps the dots at maxDots with an overflow count", () => {
    render(<Fixture maxDots={1} />);
    expect(day("2026-06-10").querySelectorAll(".calendar__dot")).toHaveLength(1);
    expect(day("2026-06-10").querySelector(".calendar__more")).toHaveTextContent("+1");
  });

  it("navigates months with previous and next, and jumps back to today", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /July 2026/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("heading", { name: /May 2026/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Today" }));
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(day(iso)).toHaveAttribute("aria-current", "date");
    expect(day(iso)).toHaveFocus();
  });

  it("hides the Today button with showToday={false}", () => {
    render(<Fixture showToday={false} />);
    expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
  });

  it("keeps one tab stop and moves it by day and week with the arrows", () => {
    render(<Fixture />);
    expect(day("2026-06-15")).toHaveAttribute("tabindex", "0");
    expect(day("2026-06-16")).toHaveAttribute("tabindex", "-1");
    day("2026-06-15").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "ArrowRight" });
    expect(day("2026-06-16")).toHaveFocus();
    expect(day("2026-06-16")).toHaveAttribute("tabindex", "0");
    expect(day("2026-06-15")).toHaveAttribute("tabindex", "-1");
    fireEvent.keyDown(day("2026-06-16"), { key: "ArrowDown" });
    expect(day("2026-06-23")).toHaveFocus();
    fireEvent.keyDown(day("2026-06-23"), { key: "ArrowUp" });
    fireEvent.keyDown(day("2026-06-16"), { key: "ArrowLeft" });
    expect(day("2026-06-15")).toHaveFocus();
  });

  it("jumps to the week edges with Home and End", () => {
    render(<Fixture />);
    day("2026-06-17").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "End" });
    expect(day("2026-06-21")).toHaveFocus();
    fireEvent.keyDown(day("2026-06-21"), { key: "Home" });
    expect(day("2026-06-15")).toHaveFocus();
  });

  it("steps a month with PageUp/PageDown and a year with Shift, into a new grid", () => {
    render(<Fixture />);
    day("2026-06-15").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "PageDown" });
    expect(screen.getByRole("heading", { name: /July 2026/i })).toBeInTheDocument();
    expect(day("2026-07-15")).toHaveFocus();
    fireEvent.keyDown(day("2026-07-15"), { key: "PageUp", shiftKey: true });
    expect(screen.getByRole("heading", { name: /July 2025/i })).toBeInTheDocument();
    expect(day("2025-07-15")).toHaveFocus();
  });

  it("selects the focused day with Enter and Space", () => {
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    fireEvent.keyDown(day("2026-06-15"), { key: "ArrowRight" });
    fireEvent.keyDown(day("2026-06-16"), { key: "Enter" });
    fireEvent.keyDown(day("2026-06-16"), { key: "ArrowRight" });
    fireEvent.keyDown(day("2026-06-17"), { key: " " });
    expect(onValueChange.mock.calls).toEqual([["2026-06-16"], ["2026-06-17"]]);
  });

  it("disables and refuses dates outside min and max, and keeps focus inside", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fixture min="2026-06-10" max="2026-06-20" onValueChange={onValueChange} />);
    expect(day("2026-06-05")).toHaveAttribute("data-disabled", "");
    expect(day("2026-06-05")).toHaveAttribute("aria-disabled", "true");
    await user.click(day("2026-06-05"));
    expect(onValueChange).not.toHaveBeenCalled();
    day("2026-06-15").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "PageDown" });
    expect(day("2026-06-20")).toHaveFocus();
  });

  it("follows the visual direction of the arrows in right-to-left text", () => {
    render(
      <div dir="rtl">
        <Fixture />
      </div>,
    );
    day("2026-06-15").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "ArrowLeft" });
    expect(day("2026-06-16")).toHaveFocus();
    fireEvent.keyDown(day("2026-06-16"), { key: "ArrowRight" });
    expect(day("2026-06-15")).toHaveFocus();
  });

  it("points the previous and next glyphs along a right-to-left provider", () => {
    render(
      <LocaleProvider locale="ar">
        <Fixture />
      </LocaleProvider>,
    );
    const glyph = (name: RegExp) =>
      screen.getByRole("button", { name }).querySelector("polyline")!.getAttribute("points");
    expect(glyph(/السابق|Previous/)).toBe("9 6 15 12 9 18");
  });

  it("follows min, max and weekStartsOn changed after mount, reporting nothing", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Fixture onValueChange={onValueChange} />);
    rerender(
      <Fixture min="2026-06-10" max="2026-06-20" weekStartsOn={0} onValueChange={onValueChange} />,
    );
    expect(day("2026-06-05")).toHaveAttribute("aria-disabled", "true");
    expect(day("2026-06-25")).toHaveAttribute("aria-disabled", "true");
    expect(day("2026-06-15")).not.toHaveAttribute("aria-disabled");
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Sunday");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("reflects a controlled value without reporting, and settles on a value written back", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function PutBack() {
      const [value, setValue] = useState<string | null>("2026-06-15");
      return (
        <Fixture
          value={value}
          onValueChange={(iso) => {
            onValueChange(iso);
            setValue("2026-06-02");
          }}
        />
      );
    }
    render(<PutBack />);
    await user.click(day("2026-06-20"));
    expect(onValueChange).toHaveBeenCalledWith("2026-06-20");
    expect(day("2026-06-02")).toHaveAttribute("data-selected", "");
    expect(day("2026-06-20")).not.toHaveAttribute("data-selected");

    const silent = vi.fn();
    const { rerender } = render(<Fixture value="2026-06-15" onValueChange={silent} />);
    rerender(<Fixture value="2026-06-16" onValueChange={silent} />);
    expect(silent).not.toHaveBeenCalled();
  });

  it("calls the latest callback after it is swapped", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Fixture onValueChange={first} />);
    rerender(<Fixture onValueChange={second} />);
    await user.click(day("2026-06-20"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("2026-06-20");
  });

  it("renders custom day content through renderDay", () => {
    render(
      <Fixture
        renderDay={({ date, selected, events }) => (
          <span className="custom">
            {date.slice(-2)}
            {selected ? "*" : ""}
            {events.length ? `(${events.length})` : ""}
          </span>
        )}
      />,
    );
    expect(day("2026-06-15")).toHaveTextContent("15*");
    expect(day("2026-06-10")).toHaveTextContent("10(2)");
    expect(day("2026-06-10").querySelector(".calendar__dot")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Fixture />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React Calendar locale", () => {
  it("names months and days in the provider's locale, labels from its catalog", () => {
    render(
      <LocaleProvider
        locale="it"
        messages={{ "calendar.next": "Successivo", "calendar.label": "Calendario" }}
      >
        <Calendar value="2026-06-15" />
      </LocaleProvider>,
    );
    expect(screen.getByRole("heading", { name: /giugno 2026/i })).toBeInTheDocument();
    expect(day("2026-06-15")).toHaveAccessibleName("lunedì 15 giugno 2026");
    expect(screen.getByRole("button", { name: "Successivo" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "Calendario" })).toBeInTheDocument();
  });

  it("prefers the locale prop and the label props", () => {
    render(<Calendar value="2026-06-15" locale="de" nextLabel="Weiter" label="Reisedatum" />);
    expect(screen.getByRole("heading", { name: /Juni 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "Reisedatum" })).toBeInTheDocument();
  });
});

describe("React Calendar views", () => {
  it("renders two months without duplicate day ids and steps one month", async () => {
    const user = userEvent.setup();
    render(<Fixture view="two-month" />);
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(day("2026-07-20")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-date="2026-07-01"]')).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /June\s*–\s*July 2026/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /July\s*–\s*August 2026/i })).toBeInTheDocument();
  });

  it("week view shows 7 columns with their events and steps by a week", async () => {
    const user = userEvent.setup();
    render(<Fixture view="week" />);
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(7);
    expect(day("2026-06-18").parentElement).toHaveTextContent("Review");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(day("2026-06-22")).toBeInTheDocument();
    expect(document.querySelector('[data-date="2026-06-15"]')).toBeNull();
  });

  it("three-day and day views show their columns", () => {
    const { unmount } = render(<Fixture view="three-day" focusedDate="2026-06-12" value={null} />);
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(3);
    expect(day("2026-06-12").parentElement).toHaveTextContent("€120");
    unmount();
    render(<Fixture view="day" />);
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /Monday, June 15, 2026/i })).toBeInTheDocument();
  });

  it("year view renders 12 mini-months and opens a month from its title", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(<Fixture view="year" onViewChange={onViewChange} />);
    expect(screen.getByRole("heading", { name: "2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("grid")).toHaveLength(12);
    expect(day("2026-06-15")).toHaveAttribute("data-selected", "");
    await user.click(screen.getByRole("button", { name: "January" }));
    expect(screen.getByRole("heading", { name: /January 2026/i })).toBeInTheDocument();
    expect(onViewChange.mock.calls).toEqual([["month"]]);
  });

  it("lays the year out in yearColumns columns", () => {
    render(<Fixture view="year" yearColumns={3} />);
    const year = document.querySelector<HTMLElement>(".calendar__year")!;
    expect(year.style.getPropertyValue("--year-cols")).toBe("3");
  });

  it("switches view through the segmented control and keeps focus on it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fixture views={["month", "week", "day"]} onValueChange={onValueChange} />);
    await user.click(screen.getByRole("radio", { name: "Day" }));
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "Day" })).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations in the week and year views", async () => {
    const { container, unmount } = render(<Fixture view="week" views={["month", "week"]} />);
    expect(await axe(container)).toHaveNoViolations();
    unmount();
    const year = render(<Fixture view="year" />);
    expect(await axe(year.container)).toHaveNoViolations();
  }, 30_000);
});

describe("React Calendar range mode", () => {
  const Range = (props: Partial<CalendarProps>) => (
    <Fixture
      value={null}
      mode="range"
      rangeStart="2026-06-10"
      rangeEnd="2026-06-14"
      focusedDate="2026-06-10"
      {...props}
    />
  );

  it("marks the endpoints and the days between", () => {
    render(<Range />);
    expect(day("2026-06-10")).toHaveAttribute("data-range-start", "");
    expect(day("2026-06-14")).toHaveAttribute("data-range-end", "");
    expect(day("2026-06-12")).toHaveAttribute("data-in-range", "");
    expect(day("2026-06-15")).not.toHaveAttribute("data-in-range");
  });

  it("selects every day of the range and names its endpoints", () => {
    render(<Range />);
    for (const iso of ["2026-06-10", "2026-06-12", "2026-06-14"]) {
      expect(cell(iso)).toHaveAttribute("aria-selected", "true");
    }
    expect(cell("2026-06-15")).not.toHaveAttribute("aria-selected");
    expect(day("2026-06-10").getAttribute("aria-label")).toMatch(/, range start$/);
    expect(day("2026-06-14").getAttribute("aria-label")).toMatch(/, range end$/);
    expect(day("2026-06-12").getAttribute("aria-label")).not.toMatch(/range/);
  });

  it("completes a range across two picks, swapping an earlier second pick", async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Range
        rangeStart={null}
        rangeEnd={null}
        onRangeChange={onRangeChange}
        onValueChange={onValueChange}
      />,
    );
    await user.click(day("2026-06-12"));
    await user.click(day("2026-06-08"));
    await user.click(day("2026-06-20"));
    expect(onRangeChange.mock.calls).toEqual([
      ["2026-06-12", null],
      ["2026-06-08", "2026-06-12"],
      ["2026-06-20", null],
    ]);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(day("2026-06-20")).toHaveAttribute("data-range-start", "");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Range />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
