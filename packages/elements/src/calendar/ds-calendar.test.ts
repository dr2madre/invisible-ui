import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { CalendarEvent, DsCalendar } from "./ds-calendar";

const EVENTS: CalendarEvent[] = [
  { date: "2026-06-10", label: "Standup", tone: "primary" },
  { date: "2026-06-10", label: "Lunch", tone: "success" },
  { date: "2026-06-18", label: "Review", tone: "warning" },
];
const PRICES = { "2026-06-12": "€120", "2026-06-13": "€90" };

const mount = (attrs = 'value="2026-06-15" focused-date="2026-06-15"', lang = "en-US") => {
  document.body.innerHTML = `<main lang="${lang}"><ds-calendar ${attrs}></ds-calendar></main>`;
  const host = document.querySelector("ds-calendar") as DsCalendar;
  host.events = EVENTS;
  host.prices = PRICES;
  return host;
};
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const grid = () => screen.getByRole("grid", { name: "Calendar" });
const changes = (host: HTMLElement, type = "change") => {
  const seen: unknown[] = [];
  host.addEventListener(type, (event) => seen.push((event as CustomEvent).detail));
  return seen;
};

describe("<ds-calendar> month view", () => {
  it("renders the period title and a 6x7 day grid", () => {
    mount();
    expect(screen.getByRole("heading", { name: /June 2026/i })).toBeInTheDocument();
    expect(grid().querySelectorAll(".calendar__day")).toHaveLength(42);
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("marks the selected day and flags days outside the month", () => {
    mount();
    expect(day("2026-06-15")).toHaveAttribute("data-selected", "");
    expect(day("2026-06-15").parentElement).toHaveAttribute("aria-selected", "true");
    expect(day("2026-07-01")).toHaveClass("calendar__day--outside");
  });

  it("selects a day on click and reports it", async () => {
    const user = userEvent.setup();
    const host = mount();
    const seen = changes(host);
    await user.click(day("2026-06-20"));
    expect(seen).toEqual([{ value: "2026-06-20" }]);
    expect(host.value).toBe("2026-06-20");
    expect(host).toHaveAttribute("value", "2026-06-20");
    expect(day("2026-06-20")).toHaveAttribute("data-selected", "");
    expect(day("2026-06-20")).toHaveFocus();
  });

  it("settles on the day a page writes back from the listener", async () => {
    const user = userEvent.setup();
    const host = mount();
    host.addEventListener("change", () => host.setAttribute("value", "2026-06-02"));
    await user.click(day("2026-06-20"));
    expect(day("2026-06-02")).toHaveAttribute("data-selected", "");
    expect(day("2026-06-20")).not.toHaveAttribute("data-selected");
  });

  it("shows appointment dots and a price per day, named in the day's label", () => {
    mount();
    expect(day("2026-06-10").querySelectorAll(".calendar__dot")).toHaveLength(2);
    expect(day("2026-06-12")).toHaveTextContent("€120");
    expect(day("2026-06-10")).toHaveAccessibleName("Wednesday, June 10, 2026, 2 events");
    expect(day("2026-06-18")).toHaveAccessibleName("Thursday, June 18, 2026, 1 event");
    expect(day("2026-06-12")).toHaveAccessibleName("Friday, June 12, 2026, €120");
  });

  it("navigates months with previous and next, and jumps back to today", async () => {
    const user = userEvent.setup();
    const host = mount();
    const focus = changes(host, "focus-change");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /July 2026/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("heading", { name: /May 2026/i })).toBeInTheDocument();
    expect(focus).toEqual([
      { value: "2026-07-15" },
      { value: "2026-06-15" },
      { value: "2026-05-15" },
    ]);
    await user.click(screen.getByRole("button", { name: "Today" }));
    const now = new Date();
    const title = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(now);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });

  it("hides the Today button with show-today=false", () => {
    mount('value="2026-06-15" show-today="false"');
    expect(screen.queryByRole("button", { name: "Today" })).not.toBeInTheDocument();
  });

  it("keeps one tab stop and moves it by day and week with the arrows", () => {
    mount();
    expect(day("2026-06-15")).toHaveAttribute("tabindex", "0");
    expect(day("2026-06-16")).toHaveAttribute("tabindex", "-1");
    day("2026-06-15").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "ArrowRight" });
    expect(day("2026-06-16")).toHaveAttribute("tabindex", "0");
    expect(day("2026-06-16")).toHaveFocus();
    fireEvent.keyDown(day("2026-06-16"), { key: "ArrowDown" });
    expect(day("2026-06-23")).toHaveFocus();
    fireEvent.keyDown(day("2026-06-23"), { key: "ArrowUp" });
    fireEvent.keyDown(day("2026-06-16"), { key: "ArrowLeft" });
    expect(day("2026-06-15")).toHaveFocus();
  });

  it("jumps to the week edges with Home and End", () => {
    mount();
    day("2026-06-17").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "End" });
    // en-US weeks run Sunday to Saturday.
    expect(day("2026-06-20")).toHaveFocus();
    fireEvent.keyDown(day("2026-06-20"), { key: "Home" });
    expect(day("2026-06-14")).toHaveFocus();
  });

  it("steps a month with PageUp/PageDown and a year with Shift", () => {
    mount();
    day("2026-06-15").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "PageDown" });
    expect(day("2026-07-15")).toHaveFocus();
    expect(screen.getByRole("heading", { name: /July 2026/i })).toBeInTheDocument();
    fireEvent.keyDown(day("2026-07-15"), { key: "PageUp" });
    expect(day("2026-06-15")).toHaveFocus();
    fireEvent.keyDown(day("2026-06-15"), { key: "PageDown", shiftKey: true });
    expect(day("2027-06-15")).toHaveFocus();
    fireEvent.keyDown(day("2027-06-15"), { key: "PageUp", shiftKey: true });
    expect(day("2026-06-15")).toHaveFocus();
  });

  it("selects the focused day with Enter and Space", () => {
    const host = mount();
    const seen = changes(host);
    day("2026-06-15").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "ArrowRight" });
    fireEvent.keyDown(day("2026-06-16"), { key: "Enter" });
    fireEvent.keyDown(day("2026-06-16"), { key: "ArrowRight" });
    fireEvent.keyDown(day("2026-06-17"), { key: " " });
    expect(seen).toEqual([{ value: "2026-06-16" }, { value: "2026-06-17" }]);
  });

  it("disables and refuses dates outside min and max, and keeps focus inside", async () => {
    const user = userEvent.setup();
    const host = mount('value="2026-06-15" min="2026-06-10" max="2026-06-20"');
    const seen = changes(host);
    expect(day("2026-06-05")).toHaveAttribute("data-disabled", "");
    expect(day("2026-06-05")).toHaveAttribute("aria-disabled", "true");
    await user.click(day("2026-06-05"));
    expect(seen).toEqual([]);
    day("2026-06-15").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "PageDown" });
    expect(day("2026-06-20")).toHaveFocus();
  });

  it("follows the visual direction of the arrows in right-to-left text", () => {
    const host = mount();
    host.setAttribute("dir", "rtl");
    day("2026-06-15").focus();
    fireEvent.keyDown(day("2026-06-15"), { key: "ArrowLeft" });
    expect(day("2026-06-16")).toHaveFocus();
    fireEvent.keyDown(day("2026-06-16"), { key: "ArrowRight" });
    expect(day("2026-06-15")).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-calendar> locale", () => {
  it("starts the week on the locale's first day", () => {
    mount('value="2026-06-15"', "it");
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("lunedì");
    mount('value="2026-06-15"', "en-US");
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Sunday");
  });

  it("lets week-starts-on override the locale", () => {
    mount('value="2026-06-15" week-starts-on="1"', "en-US");
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Monday");
  });

  it("names months and days in the locale of the closest provider, labels from its catalog", async () => {
    document.body.innerHTML = `<ds-locale-provider locale="it">
      <ds-calendar value="2026-06-15"></ds-calendar>
    </ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as HTMLElement & {
      messages: Record<string, string>;
    };
    expect(screen.getByRole("heading", { name: /giugno 2026/i })).toBeInTheDocument();
    expect(day("2026-06-15")).toHaveAccessibleName("lunedì 15 giugno 2026");

    provider.messages = { "calendar.next": "Successivo", "calendar.label": "Calendario" };
    await Promise.resolve();
    expect(screen.getByRole("button", { name: "Successivo" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "Calendario" })).toBeInTheDocument();
  });

  it("prefers the locale attribute and a label attribute", () => {
    mount('value="2026-06-15" locale="de" next-label="Weiter" label="Reisedatum"', "en-US");
    expect(screen.getByRole("heading", { name: /Juni 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weiter" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "Reisedatum" })).toBeInTheDocument();
  });
});

describe("<ds-calendar> views", () => {
  it("renders two months without duplicate day ids", () => {
    mount('value="2026-06-15" view="two-month"');
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(document.querySelectorAll('[data-date="2026-07-01"]')).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /June\s*–\s*July 2026/i })).toBeInTheDocument();
  });

  it("week view shows 7 columns with their events and steps by a week", async () => {
    const user = userEvent.setup();
    mount('value="2026-06-15" view="week" week-starts-on="1"');
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(7);
    expect(day("2026-06-18").parentElement).toHaveTextContent("Review");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(day("2026-06-22")).toBeInTheDocument();
    expect(document.querySelector('[data-date="2026-06-15"]')).toBeNull();
  });

  it("three-day and day views show their columns", () => {
    mount('focused-date="2026-06-12" view="three-day"');
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(3);
    expect(day("2026-06-12").parentElement).toHaveTextContent("€120");
    mount('focused-date="2026-06-15" view="day"');
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /Monday, June 15, 2026/i })).toBeInTheDocument();
  });

  it("year view renders 12 mini-months and opens a month from its title", async () => {
    const user = userEvent.setup();
    const host = mount('value="2026-06-15" view="year"');
    const views = changes(host, "view-change");
    expect(screen.getByRole("heading", { name: "2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("grid")).toHaveLength(12);
    expect(day("2026-06-15")).toHaveAttribute("data-selected", "");
    await user.click(screen.getByRole("button", { name: "January" }));
    expect(screen.getByRole("heading", { name: /January 2026/i })).toBeInTheDocument();
    expect(views).toEqual([{ view: "month" }]);
    expect(host.view).toBe("month");
  });

  it("switches view through the segmented control, without leaking its change", async () => {
    const user = userEvent.setup();
    const host = mount('value="2026-06-15" views="month week day"');
    const seen = changes(host);
    await user.click(screen.getByRole("radio", { name: "Day" }));
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(1);
    expect(seen).toEqual([]);
  });

  it("has no accessibility violations in the week and year views", async () => {
    mount('value="2026-06-15" view="week" views="month week"');
    expect(await axe(document.body)).toHaveNoViolations();
    mount('value="2026-06-15" view="year"');
    expect(await axe(document.body)).toHaveNoViolations();
  }, 30_000);
});

describe("<ds-calendar> range mode", () => {
  it("marks the endpoints and the days between", () => {
    mount('mode="range" range-start="2026-06-10" range-end="2026-06-14" focused-date="2026-06-10"');
    expect(day("2026-06-10")).toHaveAttribute("data-range-start", "");
    expect(day("2026-06-14")).toHaveAttribute("data-range-end", "");
    expect(day("2026-06-12")).toHaveAttribute("data-in-range", "");
    expect(day("2026-06-15")).not.toHaveAttribute("data-in-range");
  });

  it("completes a range across two picks, swapping an earlier second pick", async () => {
    const user = userEvent.setup();
    const host = mount('mode="range" focused-date="2026-06-10"');
    const seen = changes(host, "range-change");
    await user.click(day("2026-06-12"));
    await user.click(day("2026-06-08"));
    await user.click(day("2026-06-20"));
    expect(seen).toEqual([
      { start: "2026-06-12", end: null },
      { start: "2026-06-08", end: "2026-06-12" },
      { start: "2026-06-20", end: null },
    ]);
    expect(host.rangeStart).toBe("2026-06-20");
    expect(host.rangeEnd).toBeNull();
  });
});
