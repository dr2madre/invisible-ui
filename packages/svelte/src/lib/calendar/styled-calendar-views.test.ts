import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./calendar.fixture.svelte";

const dayButton = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe("Calendar — two-month view", () => {
  it("renders two month grids side by side without duplicate day ids", () => {
    render(Fixture, { props: { view: "two-month" } });
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    // June (focused) and July are both present.
    expect(dayButton("2026-06-15")).toBeInTheDocument();
    expect(dayButton("2026-07-20")).toBeInTheDocument();
    // July 1 appears once (as July's in-month day), not duplicated as June's spillover.
    expect(document.querySelectorAll('[data-date="2026-07-01"]')).toHaveLength(1);
    // The period title spans both months.
    expect(screen.getByRole("heading", { name: /June\s*–\s*July 2026/i })).toBeInTheDocument();
  });

  it("steps one month at a time", async () => {
    render(Fixture, { props: { view: "two-month" } });
    await fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /July\s*–\s*August 2026/i })).toBeInTheDocument();
  });
});

describe("Calendar — agenda views", () => {
  it("week view shows 7 day columns with their events", () => {
    render(Fixture, { props: { view: "week" } });
    // Monday-start week containing 2026-06-15 → 2026-06-15 … 06-21.
    expect(dayButton("2026-06-15")).toBeInTheDocument();
    expect(dayButton("2026-06-21")).toBeInTheDocument();
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(7);
    // The event on the 18th is listed by label.
    expect(dayButton("2026-06-18").parentElement).toHaveTextContent("Review");
  });

  it("three-day view shows 3 columns starting at the focused day", () => {
    render(Fixture, { props: { view: "three-day", focusedDate: "2026-06-12", value: null } });
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(3);
    expect(dayButton("2026-06-12")).toBeInTheDocument();
    expect(dayButton("2026-06-14")).toBeInTheDocument();
    // The price for the 12th shows in its column.
    expect(dayButton("2026-06-12").parentElement).toHaveTextContent("€120");
  });

  it("day view shows a single column and the full date title", () => {
    render(Fixture, { props: { view: "day", focusedDate: "2026-06-15" } });
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /Monday, June 15, 2026/i })).toBeInTheDocument();
  });

  it("week → next moves forward by 7 days", async () => {
    render(Fixture, { props: { view: "week", focusedDate: "2026-06-15", value: null } });
    await fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(dayButton("2026-06-22")).toBeInTheDocument();
    expect(document.querySelector('[data-date="2026-06-15"]')).toBeNull();
  });
});

describe("Calendar — year view", () => {
  it("renders 12 simplified mini-months and the year title", () => {
    render(Fixture, { props: { view: "year", focusedDate: "2026-06-15" } });
    expect(screen.getByRole("heading", { name: "2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("grid")).toHaveLength(12);
    expect(dayButton("2026-01-15")).toBeInTheDocument();
    expect(dayButton("2026-12-25")).toBeInTheDocument();
    // The selected day keeps its highlight in the mini-month.
    expect(dayButton("2026-06-15")).toHaveAttribute("data-selected", "");
  });

  it("jumps to the month view when a month title is clicked", async () => {
    render(Fixture, { props: { view: "year", focusedDate: "2026-06-15" } });
    await fireEvent.click(screen.getByRole("button", { name: "January" }));
    expect(screen.getByRole("grid", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /January 2026/i })).toBeInTheDocument();
  });

  it("steps a whole year with next/prev", async () => {
    render(Fixture, { props: { view: "year", focusedDate: "2026-06-15" } });
    await fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "2027" })).toBeInTheDocument();
    expect(dayButton("2027-03-10")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { view: "year" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Calendar — view switcher", () => {
  it("switches view via the segmented control", async () => {
    render(Fixture, {
      props: { views: ["month", "week", "day"], view: "month", focusedDate: "2026-06-15" },
    });
    expect(screen.getByRole("grid", { name: "Calendar" })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("radio", { name: "Day" }));
    expect(document.querySelectorAll(".calendar__agenda-col")).toHaveLength(1);
  });

  it("has no accessibility violations in week view", async () => {
    const { container } = render(Fixture, {
      props: { view: "week", views: ["month", "week", "day"] },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
