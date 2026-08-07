import { fireEvent, render, screen } from "@testing-library/vue";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { TimeField } from "./TimeField";

const noAxeRegion = { rules: { region: { enabled: false } } };

const renderField = (props: Record<string, unknown> = {}) =>
  render(TimeField, { props: { label: "Start time", ...props } });

const seg = (name: string) =>
  screen.getByRole("spinbutton", { name: new RegExp(`^${name}$`, "i") });

describe("Vue TimeField (styled)", () => {
  it("renders hour and minute spinbuttons (24h) with the value", () => {
    renderField({ value: "09:30" });
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    expect(seg("hour")).toHaveTextContent("09");
    expect(seg("minute")).toHaveTextContent("30");
    expect(seg("hour")).toHaveAttribute("aria-valuenow", "9");
  });

  it("groups the segments under the field label", () => {
    renderField({ value: "09:30" });
    expect(screen.getByRole("group", { name: "Start time" })).toBeInTheDocument();
  });

  it("shows placeholders while empty", () => {
    renderField();
    expect(seg("hour")).toHaveTextContent("hh");
    expect(seg("minute")).toHaveTextContent("mm");
    expect(seg("hour")).toHaveClass("time-field__segment--placeholder");
  });

  it("adds a seconds segment when configured", () => {
    renderField({ value: "09:30:15", withSeconds: true });
    expect(seg("second")).toHaveTextContent("15");
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
  });

  it("adds an AM/PM segment in 12-hour mode", () => {
    renderField({ value: "21:30", hourCycle: 12 });
    expect(seg("hour")).toHaveTextContent("09"); // 21h shows as 9 PM
    expect(seg("AM/PM")).toHaveTextContent("PM");
  });

  it("normalizes a completed flexible value to the canonical form", () => {
    renderField({ value: "9:30", name: "time" });
    expect(seg("hour")).toHaveTextContent("09");
    expect(document.querySelector('input[name="time"]')).toHaveValue("09:30");
  });

  it("does not infer AM while a 12-hour value is incomplete", async () => {
    const onValueChange = vi.fn();
    renderField({ hourCycle: 12, onValueChange });
    expect(seg("AM/PM")).toHaveTextContent("--");

    await fireEvent.keyDown(seg("hour"), { key: "9" });
    await fireEvent.keyDown(seg("minute"), { key: "3" });
    await fireEvent.keyDown(seg("minute"), { key: "0" });
    expect(onValueChange).not.toHaveBeenCalledWith("09:30");

    await fireEvent.keyDown(seg("AM/PM"), { key: "p" });
    expect(onValueChange).toHaveBeenLastCalledWith("21:30");
  });

  it("identifies an invalid external value without partially accepting it", () => {
    renderField({ value: "25:30" });
    const group = screen.getByRole("group", { name: "Start time" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAttribute("aria-describedby");
    expect(seg("hour")).toHaveTextContent("hh");
    expect(seg("minute")).toHaveTextContent("mm");
    expect(seg("hour")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a time within the allowed range.")).toBeInTheDocument();
  });

  it("increments a segment with ArrowUp and reports the new value", async () => {
    const onValueChange = vi.fn();
    renderField({ value: "09:30", onValueChange });
    await fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("31");
    expect(onValueChange).toHaveBeenLastCalledWith("09:31");
  });

  it("wraps on overflow (59 to 00)", async () => {
    renderField({ value: "09:59" });
    await fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("00");
  });

  it("types digits into a segment", async () => {
    const onValueChange = vi.fn();
    renderField({ value: "00:00", onValueChange });
    await fireEvent.keyDown(seg("hour"), { key: "1" });
    await fireEvent.keyDown(seg("hour"), { key: "4" });
    expect(seg("hour")).toHaveTextContent("14");
    expect(onValueChange).toHaveBeenLastCalledWith("14:00");
  });

  it("does not reinterpret an impossible second digit", async () => {
    const onValueChange = vi.fn();
    renderField({ value: "00:00", onValueChange });
    seg("hour").focus();
    await fireEvent.keyDown(seg("hour"), { key: "2" });
    await fireEvent.keyDown(seg("hour"), { key: "5" });
    expect(seg("hour")).toHaveTextContent("02");
    expect(seg("hour")).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith("02:00");
  });

  it("does not edit a disabled field", async () => {
    const onValueChange = vi.fn();
    renderField({ value: "09:30", disabled: true, onValueChange });
    await fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("30");
    expect(seg("minute")).toHaveAttribute("tabindex", "-1");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("moves focus to the next segment once a segment is full", async () => {
    renderField({ value: "00:00" });
    seg("hour").focus();
    await fireEvent.keyDown(seg("hour"), { key: "1" });
    await fireEvent.keyDown(seg("hour"), { key: "4" });
    expect(seg("minute")).toHaveFocus();
  });

  it("moves between segments with ArrowRight and ArrowLeft", async () => {
    renderField({ value: "09:30" });
    seg("hour").focus();
    await fireEvent.keyDown(seg("hour"), { key: "ArrowRight" });
    expect(seg("minute")).toHaveFocus();
    await fireEvent.keyDown(seg("minute"), { key: "ArrowLeft" });
    expect(seg("hour")).toHaveFocus();
  });

  it("clears a segment with Backspace and reports null", async () => {
    const onValueChange = vi.fn();
    renderField({ value: "09:30", onValueChange });
    await fireEvent.keyDown(seg("minute"), { key: "Backspace" });
    expect(seg("minute")).toHaveTextContent("mm");
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("sets the period with the P key in 12-hour mode", async () => {
    const onValueChange = vi.fn();
    renderField({ value: "09:00", hourCycle: 12, onValueChange });
    expect(seg("AM/PM")).toHaveTextContent("AM");
    await fireEvent.keyDown(seg("AM/PM"), { key: "p" });
    expect(seg("AM/PM")).toHaveTextContent("PM");
    expect(onValueChange).toHaveBeenLastCalledWith("21:00");
  });

  it("emits update:modelValue so the value binds with v-model", async () => {
    const { emitted } = render(TimeField, { props: { label: "Time", modelValue: "09:30" } });
    await fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(emitted()["update:modelValue"]).toEqual([["09:31"]]);
  });

  it("submits the formatted time under the field name", () => {
    render({
      render: () =>
        h("form", { "data-testid": "form" }, [h(TimeField, { name: "time", value: "09:30" })]),
    });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("time")).toBe("09:30");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderField({ value: "09:30", hourCycle: 12 });
    expect(await axe(container, noAxeRegion)).toHaveNoViolations();
  });
});
