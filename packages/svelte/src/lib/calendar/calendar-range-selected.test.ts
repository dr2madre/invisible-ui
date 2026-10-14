import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Calendar from "./Calendar.svelte";

const cell = (iso: string) =>
  document.querySelector<HTMLElement>(`[data-date="${iso}"]`)!.closest('[role="gridcell"]')!;
const day = (iso: string) => document.querySelector<HTMLElement>(`[data-date="${iso}"]`)!;

const props = {
  mode: "range" as const,
  rangeStart: "2026-06-10",
  rangeEnd: "2026-06-14",
  focusedDate: "2026-06-10",
  locale: "en-US",
};

describe("Svelte Calendar range for assistive technology", () => {
  it("selects every day of the range and names its endpoints", () => {
    render(Calendar, { props });
    for (const iso of ["2026-06-10", "2026-06-12", "2026-06-14"]) {
      expect(cell(iso)).toHaveAttribute("aria-selected", "true");
    }
    expect(cell("2026-06-15")).not.toHaveAttribute("aria-selected");
    expect(cell("2026-06-09")).not.toHaveAttribute("aria-selected");
    expect(day("2026-06-10").getAttribute("aria-label")).toMatch(/, range start$/);
    expect(day("2026-06-14").getAttribute("aria-label")).toMatch(/, range end$/);
    expect(day("2026-06-12").getAttribute("aria-label")).not.toMatch(/range/);
  });

  it("follows the range when it changes", async () => {
    const { rerender } = render(Calendar, { props });
    await rerender({ rangeStart: "2026-06-16", rangeEnd: "2026-06-18" });
    expect(cell("2026-06-12")).not.toHaveAttribute("aria-selected");
    expect(cell("2026-06-17")).toHaveAttribute("aria-selected", "true");
  });

  it("leaves a single-date calendar to its one selected day", () => {
    render(Calendar, {
      props: { value: "2026-06-15", focusedDate: "2026-06-15", locale: "en-US" },
    });
    expect(cell("2026-06-15")).toHaveAttribute("aria-selected", "true");
    expect(cell("2026-06-16")).not.toHaveAttribute("aria-selected");
    expect(day("2026-06-15").getAttribute("aria-label")).not.toMatch(/range/);
  });
});
