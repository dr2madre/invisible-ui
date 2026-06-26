import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./date-range-picker.fixture.svelte";

const field = () => screen.getByRole("combobox", { name: "Stay dates" });
const dayButton = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe("Svelte DateRangePicker", () => {
  it("shows a placeholder when empty and a formatted range when set", () => {
    const { rerender } = render(Fixture);
    expect(field()).toHaveValue("");
    rerender({ start: "2026-06-10", end: "2026-06-15" });
    expect((field() as HTMLInputElement).value).toMatch(/Jun 10\s*.\s*15, 2026/);
  });

  it("shows a half-open range while only the start is set", () => {
    render(Fixture, { props: { start: "2026-06-10" } });
    expect(field()).toHaveValue("Jun 10, 2026 – …");
  });

  it("completes a range across two clicks and closes", async () => {
    const onChange = vi.fn();
    render(Fixture, { props: { start: "2026-06-10", onChange } });
    await fireEvent.click(field());
    expect(screen.getByRole("grid")).toBeInTheDocument();
    await fireEvent.click(dayButton("2026-06-15"));
    expect(onChange).toHaveBeenCalledWith("2026-06-10", "2026-06-15");
    expect((field() as HTMLInputElement).value).toMatch(/Jun 10\s*.\s*15, 2026/);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("highlights the endpoints and the days between", async () => {
    render(Fixture, { props: { start: "2026-06-10", end: "2026-06-15" } });
    await fireEvent.click(field());
    expect(dayButton("2026-06-10")).toHaveAttribute("data-range-start", "");
    expect(dayButton("2026-06-15")).toHaveAttribute("data-range-end", "");
    expect(dayButton("2026-06-12")).toHaveAttribute("data-in-range", "");
    expect(dayButton("2026-06-16")).not.toHaveAttribute("data-in-range");
  });

  it("restarts the range when both ends are already set", async () => {
    const onChange = vi.fn();
    render(Fixture, { props: { start: "2026-06-10", end: "2026-06-15", onChange } });
    await fireEvent.click(field());
    await fireEvent.click(dayButton("2026-06-20"));
    expect(onChange).toHaveBeenCalledWith("2026-06-20", null);
  });

  it("clears the range via the clear button", async () => {
    const onChange = vi.fn();
    render(Fixture, {
      props: { start: "2026-06-10", end: "2026-06-15", clearable: true, onChange },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Clear range" }));
    expect(onChange).toHaveBeenCalledWith(null, null);
    expect(field()).toHaveValue("");
  });

  it("has no accessibility violations (open, two-month)", async () => {
    const { container } = render(Fixture, { props: { start: "2026-06-10", view: "two-month" } });
    await fireEvent.click(field());
    expect(await axe(container)).toHaveNoViolations();
  });
});
