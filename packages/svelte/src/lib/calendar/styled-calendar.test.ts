import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./calendar.fixture.svelte";

const grid = () => screen.getByRole("grid", { name: "Calendar" });
const dayButton = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe("Svelte Calendar (month view)", () => {
  it("renders the period title and a 6×7 day grid", () => {
    render(Fixture);
    expect(screen.getByRole("heading", { name: /June 2026/i })).toBeInTheDocument();
    expect(grid().querySelectorAll(".calendar__day")).toHaveLength(42);
    // Weekday column headers.
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("marks the selected day and flags days outside the month", () => {
    render(Fixture);
    expect(dayButton("2026-06-15")).toHaveAttribute("data-selected", "");
    // June 2026 starts on a Monday, so the grid's trailing days spill into July.
    expect(dayButton("2026-07-01")).toHaveClass("calendar__day--outside");
  });

  it("selects a day on click", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });
    await fireEvent.click(dayButton("2026-06-20"));
    expect(onValueChange).toHaveBeenCalledWith("2026-06-20");
    expect(dayButton("2026-06-20")).toHaveAttribute("data-selected", "");
  });

  it("shows appointment dots and a price per day", () => {
    render(Fixture);
    expect(dayButton("2026-06-10").querySelectorAll(".calendar__dot")).toHaveLength(2);
    expect(dayButton("2026-06-12")).toHaveTextContent("€120");
    // The accessible name carries the event count and price.
    expect(dayButton("2026-06-10")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("2 events"),
    );
    expect(dayButton("2026-06-12")).toHaveAttribute("aria-label", expect.stringContaining("€120"));
  });

  it("navigates months with the prev/next buttons", async () => {
    render(Fixture);
    await fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: /July 2026/i })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("heading", { name: /May 2026/i })).toBeInTheDocument();
  });

  it("uses a roving tab stop on the focused day and moves it with arrow keys", async () => {
    render(Fixture);
    expect(dayButton("2026-06-15")).toHaveAttribute("tabindex", "0");
    expect(dayButton("2026-06-16")).toHaveAttribute("tabindex", "-1");
    await fireEvent.keyDown(dayButton("2026-06-15"), { key: "ArrowRight" });
    expect(dayButton("2026-06-16")).toHaveAttribute("tabindex", "0");
    expect(dayButton("2026-06-15")).toHaveAttribute("tabindex", "-1");
  });

  it("disables and refuses dates outside [min, max]", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { min: "2026-06-10", max: "2026-06-20", onValueChange } });
    expect(dayButton("2026-06-05")).toHaveAttribute("data-disabled", "");
    await fireEvent.click(dayButton("2026-06-05"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
