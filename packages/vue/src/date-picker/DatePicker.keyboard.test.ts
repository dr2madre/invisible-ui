import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "../date-range-picker/DateRangePicker";
import { DatePicker } from "./DatePicker";

const field = (name: string) => screen.getByRole("combobox", { name }) as HTMLInputElement;
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

const renderPicker = (props: Record<string, unknown> = {}) =>
  render(DatePicker, { props: { label: "Event date", locale: "en-US", ...props } });

describe("Vue DatePicker from the keyboard", () => {
  const input = () => field("Event date");

  it("opens with Enter, Space and ArrowDown, with focus on the selected day", async () => {
    renderPicker({ modelValue: "2026-06-15" });
    for (const key of ["Enter", " ", "ArrowDown"]) {
      input().focus();
      await fireEvent.keyDown(input(), { key });
      await nextTick();
      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(input()).toHaveAttribute("aria-expanded", "true");
      expect(day("2026-06-15")).toHaveFocus();
      await fireEvent.keyDown(day("2026-06-15"), { key: "Escape" });
      await nextTick();
      expect(screen.queryByRole("grid")).toBeNull();
      expect(input()).toHaveFocus();
    }
  });

  it("does not open for another key or while disabled", async () => {
    const { rerender } = renderPicker({ modelValue: "2026-06-15" });
    input().focus();
    await fireEvent.keyDown(input(), { key: "a" });
    expect(screen.queryByRole("grid")).toBeNull();
    await rerender({ disabled: true });
    await fireEvent.keyDown(input(), { key: "Enter" });
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("opens on a day, not on a calendar button, when nothing is selected", async () => {
    renderPicker();
    input().focus();
    await fireEvent.keyDown(input(), { key: "Enter" });
    await nextTick();
    const focused = document.activeElement as HTMLElement;
    expect(focused).toHaveAttribute("data-date");
  });

  it("picks a day with the keyboard, fills the field, closes and returns focus", async () => {
    const onValueChange = vi.fn();
    renderPicker({ modelValue: "2026-06-15", onValueChange });
    input().focus();
    await fireEvent.keyDown(input(), { key: "Enter" });
    await nextTick();
    await fireEvent.keyDown(day("2026-06-15"), { key: "ArrowRight" });
    await fireEvent.keyDown(day("2026-06-16"), { key: "Enter" });
    await nextTick();
    expect(onValueChange.mock.calls).toEqual([["2026-06-16"]]);
    expect(input()).toHaveValue("Jun 16, 2026");
    expect(screen.queryByRole("grid")).toBeNull();
    expect(input()).toHaveFocus();
  });

  it("returns focus to the field after a pick with the pointer", async () => {
    const user = userEvent.setup();
    renderPicker({ modelValue: "2026-06-15" });
    await user.click(input());
    await user.click(day("2026-06-20"));
    await nextTick();
    expect(screen.queryByRole("grid")).toBeNull();
    expect(input()).toHaveFocus();
  });

  it("keeps focus on the field when Clear removes its own button", async () => {
    const user = userEvent.setup();
    renderPicker({ modelValue: "2026-06-15", clearable: true });
    await user.click(screen.getByRole("button", { name: "Clear date" }));
    await nextTick();
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
    expect(input()).toHaveFocus();
  });
});

describe("Vue DateRangePicker from the keyboard", () => {
  const input = () => field("Stay dates");
  const renderRange = (props: Record<string, unknown> = {}) =>
    render(DateRangePicker, {
      props: { label: "Stay dates", locale: "en-US", view: "month", ...props },
    });

  it("opens with ArrowDown, with focus on the start day", async () => {
    renderRange({ start: "2026-06-10", end: "2026-06-14" });
    input().focus();
    await fireEvent.keyDown(input(), { key: "ArrowDown" });
    await nextTick();
    expect(day("2026-06-10")).toHaveFocus();
  });

  it("makes the range with the keyboard alone, then returns focus to the field", async () => {
    const onChange = vi.fn();
    renderRange({ start: "2026-06-10", end: "2026-06-12", onChange });
    input().focus();
    await fireEvent.keyDown(input(), { key: "Enter" });
    await nextTick();
    await fireEvent.keyDown(day("2026-06-10"), { key: "Enter" });
    await fireEvent.keyDown(day("2026-06-10"), { key: "ArrowDown" });
    await fireEvent.keyDown(day("2026-06-17"), { key: "Enter" });
    await nextTick();
    expect(onChange).toHaveBeenLastCalledWith("2026-06-10", "2026-06-17");
    expect(screen.queryByRole("grid")).toBeNull();
    expect(input()).toHaveFocus();
  });

  it("keeps focus on the field when Clear removes its own button", async () => {
    const user = userEvent.setup();
    renderRange({ start: "2026-06-10", end: "2026-06-12", clearable: true });
    await user.click(screen.getByRole("button", { name: "Clear range" }));
    await nextTick();
    expect(input()).toHaveValue("");
    expect(input()).toHaveFocus();
  });
});
