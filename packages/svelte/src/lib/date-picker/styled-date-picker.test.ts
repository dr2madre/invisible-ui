import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./date-picker.fixture.svelte";

const field = () => screen.getByRole("combobox", { name: "Event date" });
const dayButton = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe("Svelte DatePicker", () => {
  it("renders a readonly field with the label and placeholder", () => {
    render(Fixture);
    const input = field();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAttribute("placeholder", "Select a date");
    expect(input).toHaveValue("");
    // Calendar is closed until opened.
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("shows a preselected value formatted with Intl", () => {
    render(Fixture, { props: { value: "2026-06-15" } });
    expect(field()).toHaveValue("Jun 15, 2026");
  });

  it("opens the calendar and picks a day, filling the field and closing", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: "2026-06-15", onValueChange } });
    await fireEvent.click(field());
    expect(screen.getByRole("grid")).toBeInTheDocument();

    await fireEvent.click(dayButton("2026-06-20"));
    expect(onValueChange).toHaveBeenCalledWith("2026-06-20");
    expect(field()).toHaveValue("Jun 20, 2026");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("clears the value via the clear button", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: "2026-06-15", clearable: true, onValueChange } });
    await fireEvent.click(screen.getByRole("button", { name: "Clear date" }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(field()).toHaveValue("");
  });

  it("forwards min/max so out-of-range days are disabled", async () => {
    render(Fixture, { props: { value: "2026-06-15", min: "2026-06-10", max: "2026-06-20" } });
    await fireEvent.click(field());
    expect(dayButton("2026-06-05")).toHaveAttribute("data-disabled", "");
  });

  it("has no accessibility violations (open)", async () => {
    const { container } = render(Fixture, { props: { value: "2026-06-15" } });
    await fireEvent.click(field());
    expect(await axe(container)).toHaveNoViolations();
  });
});
