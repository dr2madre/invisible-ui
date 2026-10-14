import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { tick } from "svelte";
import { describe, expect, it, vi } from "vitest";
import DateFixture from "./date-picker.fixture.svelte";
import RangeFixture from "../date-range-picker/date-range-picker.fixture.svelte";

const field = (name = "Event date") => screen.getByRole("combobox", { name }) as HTMLInputElement;
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe("Svelte DatePicker from the keyboard", () => {
  it("opens with Enter, Space and ArrowDown, with focus on the selected day", async () => {
    render(DateFixture, { props: { value: "2026-06-15" } });
    for (const key of ["Enter", " ", "ArrowDown"]) {
      field().focus();
      await fireEvent.keyDown(field(), { key });
      await tick();
      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(field()).toHaveAttribute("aria-expanded", "true");
      expect(day("2026-06-15")).toHaveFocus();
      await fireEvent.keyDown(day("2026-06-15"), { key: "Escape" });
      await tick();
      expect(screen.queryByRole("grid")).toBeNull();
      expect(field()).toHaveFocus();
    }
  });

  it("does not open while disabled or when another key is pressed", async () => {
    render(DateFixture, { props: { value: "2026-06-15" } });
    field().focus();
    await fireEvent.keyDown(field(), { key: "a" });
    await fireEvent.keyDown(field(), { key: "Tab" });
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("opens on today's month day when nothing is selected, not on a calendar button", async () => {
    render(DateFixture, { props: { value: null } });
    field().focus();
    await fireEvent.keyDown(field(), { key: "Enter" });
    await tick();
    const focused = document.activeElement as HTMLElement;
    expect(focused).toHaveAttribute("data-date");
    expect(focused).not.toHaveTextContent("Today");
  });

  it("picks a day with the keyboard, fills the field, closes and returns focus", async () => {
    const onValueChange = vi.fn();
    render(DateFixture, { props: { value: "2026-06-15", onValueChange } });
    field().focus();
    await fireEvent.keyDown(field(), { key: "Enter" });
    await tick();
    await fireEvent.keyDown(day("2026-06-15"), { key: "ArrowRight" });
    await fireEvent.keyDown(day("2026-06-16"), { key: "Enter" });
    await tick();
    expect(onValueChange.mock.calls).toEqual([["2026-06-16"]]);
    expect(field()).toHaveValue("Jun 16, 2026");
    expect(screen.queryByRole("grid")).toBeNull();
    expect(field()).toHaveFocus();
  });

  it("returns focus to the field after a pick with the pointer", async () => {
    const user = userEvent.setup();
    render(DateFixture, { props: { value: "2026-06-15" } });
    await user.click(field());
    await user.click(day("2026-06-20"));
    await tick();
    expect(screen.queryByRole("grid")).toBeNull();
    expect(field()).toHaveFocus();
  });

  it("keeps focus on the field when Clear removes its own button", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(DateFixture, { props: { value: "2026-06-15", clearable: true, onValueChange } });
    await user.click(screen.getByRole("button", { name: "Clear date" }));
    await tick();
    expect(onValueChange.mock.calls).toEqual([[null]]);
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
    expect(field()).toHaveFocus();
  });
});

describe("Svelte DateRangePicker from the keyboard", () => {
  const rangeField = () => field("Stay dates");

  it("opens with ArrowDown, with focus on the start day", async () => {
    render(RangeFixture, { props: { start: "2026-06-10", end: "2026-06-14" } });
    rangeField().focus();
    await fireEvent.keyDown(rangeField(), { key: "ArrowDown" });
    await tick();
    expect(day("2026-06-10")).toHaveFocus();
  });

  it("makes the range with the keyboard alone, then returns focus to the field", async () => {
    const onChange = vi.fn();
    render(RangeFixture, { props: { start: "2026-06-10", end: "2026-06-12", onChange } });
    rangeField().focus();
    await fireEvent.keyDown(rangeField(), { key: "Enter" });
    await tick();
    await fireEvent.keyDown(day("2026-06-10"), { key: "Enter" });
    await fireEvent.keyDown(day("2026-06-10"), { key: "ArrowDown" });
    await fireEvent.keyDown(day("2026-06-17"), { key: "Enter" });
    await tick();
    expect(onChange).toHaveBeenLastCalledWith("2026-06-10", "2026-06-17");
    expect(screen.queryByRole("grid")).toBeNull();
    expect(rangeField()).toHaveFocus();
  });

  it("keeps focus on the field when Clear removes its own button", async () => {
    const user = userEvent.setup();
    render(RangeFixture, { props: { start: "2026-06-10", end: "2026-06-12", clearable: true } });
    await user.click(screen.getByRole("button", { name: "Clear range" }));
    await tick();
    expect(rangeField()).toHaveValue("");
    expect(rangeField()).toHaveFocus();
  });
});
