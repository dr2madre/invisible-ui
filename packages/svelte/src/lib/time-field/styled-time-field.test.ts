import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./time-field.fixture.svelte";

const seg = (name: string) => screen.getByRole("spinbutton", { name });

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
