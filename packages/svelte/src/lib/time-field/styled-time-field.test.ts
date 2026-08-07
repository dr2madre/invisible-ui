import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./time-field.fixture.svelte";

const seg = (name: string) =>
  screen.getByRole("spinbutton", { name: new RegExp(`^${name}$`, "i") });

describe("Svelte TimeField", () => {
  it("renders hour and minute spinbuttons (24h) with the value", () => {
    render(Fixture, { props: { value: "09:30" } });
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    expect(seg("hour")).toHaveTextContent("09");
    expect(seg("minute")).toHaveTextContent("30");
    expect(seg("hour")).toHaveAttribute("aria-valuenow", "9");
  });

  it("adds a seconds segment when configured", () => {
    render(Fixture, { props: { value: "09:30:15", withSeconds: true } });
    expect(seg("second")).toHaveTextContent("15");
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
  });

  it("adds an AM/PM segment in 12-hour mode", () => {
    render(Fixture, { props: { value: "21:30", hourCycle: 12 } });
    expect(seg("hour")).toHaveTextContent("09"); // 21h → 9 PM display
    expect(seg("AM/PM")).toHaveTextContent("PM");
  });

  it("normalizes a completed flexible value to the canonical form", () => {
    render(Fixture, { props: { value: "9:30" } });
    expect(seg("hour")).toHaveTextContent("09");
    expect(seg("minute")).toHaveTextContent("30");
  });

  it("does not infer AM while a 12-hour value is incomplete", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { hourCycle: 12, onValueChange } });
    expect(seg("AM/PM")).toHaveTextContent("--");

    await fireEvent.keyDown(seg("hour"), { key: "9" });
    await fireEvent.keyDown(seg("minute"), { key: "3" });
    await fireEvent.keyDown(seg("minute"), { key: "0" });
    expect(onValueChange).not.toHaveBeenCalledWith("09:30");

    await fireEvent.keyDown(seg("AM/PM"), { key: "p" });
    expect(onValueChange).toHaveBeenLastCalledWith("21:30");
  });

  it("identifies an invalid external value without partially accepting it", () => {
    render(Fixture, { props: { value: "25:30" } });
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
    render(Fixture, { props: { value: "09:30", onValueChange } });
    await fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("31");
    expect(onValueChange).toHaveBeenLastCalledWith("09:31");
  });

  it("wraps on overflow (59 → 00)", async () => {
    render(Fixture, { props: { value: "09:59" } });
    await fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("00");
  });

  it("types digits into a segment", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: "00:00", onValueChange } });
    await fireEvent.keyDown(seg("hour"), { key: "1" });
    await fireEvent.keyDown(seg("hour"), { key: "4" });
    expect(seg("hour")).toHaveTextContent("14");
    expect(onValueChange).toHaveBeenLastCalledWith("14:00");
  });

  it("does not reinterpret an impossible second digit", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: "00:00", onValueChange } });
    seg("hour").focus();
    await fireEvent.keyDown(seg("hour"), { key: "2" });
    await fireEvent.keyDown(seg("hour"), { key: "5" });
    expect(seg("hour")).toHaveTextContent("02");
    expect(seg("hour")).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith("02:00");
  });

  it("does not edit a disabled field", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: "09:30", disabled: true, onValueChange } });
    await fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("30");
    expect(seg("minute")).toHaveAttribute("tabindex", "-1");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("clears a segment with Backspace and reports null", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: "09:30", onValueChange } });
    await fireEvent.keyDown(seg("minute"), { key: "Backspace" });
    expect(seg("minute")).toHaveTextContent("mm");
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("sets the period with the P key in 12-hour mode", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: "09:00", hourCycle: 12, onValueChange } });
    expect(seg("AM/PM")).toHaveTextContent("AM");
    await fireEvent.keyDown(seg("AM/PM"), { key: "p" });
    expect(seg("AM/PM")).toHaveTextContent("PM");
    expect(onValueChange).toHaveBeenLastCalledWith("21:00");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: "09:30", hourCycle: 12 } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
