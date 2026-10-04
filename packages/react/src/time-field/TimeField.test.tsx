import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { TimeField, type TimeFieldProps } from "./TimeField";

const seg = (name: string) =>
  screen.getByRole("spinbutton", { name: new RegExp(`^${name}$`, "i") });
const group = () => screen.getByRole("group", { name: "Start time" });

// 24 hours unless a test says otherwise, so the default locale's 12-hour
// preference does not reshape the fixtures.
const Fixture = (props: Partial<TimeFieldProps>) => (
  <>
    <TimeField label="Start time" hourCycle={24} {...props} />
    <button type="button">after</button>
  </>
);

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe("React TimeField", () => {
  it("renders hour and minute spinbuttons (24h) with the value", () => {
    render(<Fixture value="09:30" />);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    expect(seg("hour")).toHaveTextContent("09");
    expect(seg("minute")).toHaveTextContent("30");
    expect(seg("hour")).toHaveAttribute("aria-valuenow", "9");
    expect(seg("hour")).toHaveAttribute("contenteditable", "true");
    expect(group()).toHaveAttribute("data-status", "valid");
  });

  it("shows placeholders while empty", () => {
    render(<Fixture />);
    expect(seg("hour")).toHaveTextContent("hh");
    expect(seg("hour")).toHaveClass("time-field__segment--placeholder");
    expect(seg("hour")).toHaveAttribute("aria-valuetext", "Empty");
    expect(group()).toHaveAttribute("data-status", "empty");
  });

  it("adds a seconds segment when configured", () => {
    render(<Fixture value="09:30:15" withSeconds />);
    expect(seg("second")).toHaveTextContent("15");
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
  });

  it("adds an AM/PM segment in 12-hour mode", () => {
    render(<Fixture value="21:30" hourCycle={12} />);
    expect(seg("hour")).toHaveTextContent("09");
    expect(seg("AM/PM")).toHaveTextContent("PM");
  });

  it("follows the provider locale's hour cycle, and hourCycle overrides it", () => {
    const { unmount } = render(
      <LocaleProvider locale="en-US">
        <TimeField label="Start time" value="21:30" />
      </LocaleProvider>,
    );
    expect(seg("AM/PM")).toHaveTextContent("PM");
    unmount();
    render(
      <LocaleProvider locale="it">
        <TimeField label="Start time" value="21:30" />
      </LocaleProvider>,
    );
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    expect(seg("hour")).toHaveTextContent("21");
  });

  it("keeps the PM of a value when the hour cycle changes", () => {
    const { rerender } = render(<Fixture value="21:30" />);
    rerender(<Fixture value="21:30" hourCycle={12} />);
    expect(seg("hour")).toHaveTextContent("09");
    expect(seg("AM/PM")).toHaveTextContent("PM");
  });

  it("normalizes a completed flexible value to the canonical form", () => {
    render(<Fixture value="9:30" name="start" />);
    expect(seg("hour")).toHaveTextContent("09");
    expect(document.querySelector<HTMLInputElement>('input[name="start"]')!.value).toBe("09:30");
  });

  it("does not infer AM while a 12-hour value is incomplete", () => {
    const onValueChange = vi.fn();
    render(<Fixture hourCycle={12} onValueChange={onValueChange} />);
    expect(seg("AM/PM")).toHaveTextContent("--");
    fireEvent.keyDown(seg("hour"), { key: "9" });
    fireEvent.keyDown(seg("minute"), { key: "3" });
    fireEvent.keyDown(seg("minute"), { key: "0" });
    expect(onValueChange).not.toHaveBeenCalledWith("09:30");
    expect(group()).toHaveAttribute("data-status", "incomplete");
    fireEvent.keyDown(seg("AM/PM"), { key: "p" });
    expect(onValueChange).toHaveBeenLastCalledWith("21:30");
  });

  it("identifies an invalid external value without partially accepting it", () => {
    render(<Fixture value="25:30" />);
    expect(group()).toHaveAttribute("aria-invalid", "true");
    expect(group()).toHaveAttribute("aria-describedby");
    expect(seg("hour")).toHaveTextContent("hh");
    expect(seg("minute")).toHaveTextContent("mm");
    expect(seg("hour")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a time within the allowed range.")).toBeInTheDocument();
  });

  it("increments a segment with ArrowUp, wraps on overflow, and reports each value once", () => {
    const onValueChange = vi.fn();
    render(<Fixture value="09:58" onValueChange={onValueChange} />);
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("59");
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("00");
    expect(onValueChange.mock.calls).toEqual([["09:59"], ["09:00"]]);
  });

  it("types digits, moving to the next segment when one is full", () => {
    const onValueChange = vi.fn();
    render(<Fixture value="00:00" onValueChange={onValueChange} />);
    seg("hour").focus();
    fireEvent.keyDown(seg("hour"), { key: "1" });
    fireEvent.keyDown(seg("hour"), { key: "4" });
    expect(seg("hour")).toHaveTextContent("14");
    expect(seg("minute")).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith("14:00");
  });

  it("does not reinterpret an impossible second digit", () => {
    const onValueChange = vi.fn();
    render(<Fixture value="00:00" onValueChange={onValueChange} />);
    seg("hour").focus();
    fireEvent.keyDown(seg("hour"), { key: "2" });
    fireEvent.keyDown(seg("hour"), { key: "5" });
    expect(seg("hour")).toHaveTextContent("02");
    expect(seg("hour")).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith("02:00");
  });

  it("moves between segments with ArrowLeft and ArrowRight", () => {
    render(<Fixture value="09:30" />);
    seg("hour").focus();
    fireEvent.keyDown(seg("hour"), { key: "ArrowRight" });
    expect(seg("minute")).toHaveFocus();
    fireEvent.keyDown(seg("minute"), { key: "ArrowLeft" });
    expect(seg("hour")).toHaveFocus();
  });

  it("clears a segment with Backspace and reports null", () => {
    const onValueChange = vi.fn();
    render(<Fixture value="09:30" onValueChange={onValueChange} />);
    fireEvent.keyDown(seg("minute"), { key: "Backspace" });
    expect(seg("minute")).toHaveTextContent("mm");
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("routes soft-keyboard input through the segment instead of editing its text", () => {
    const onValueChange = vi.fn();
    render(<Fixture value="09:30" onValueChange={onValueChange} />);
    const event = new InputEvent("beforeinput", {
      data: "5",
      inputType: "insertText",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      seg("minute").dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(seg("minute")).toHaveTextContent("05");
    expect(onValueChange).toHaveBeenLastCalledWith("09:05");
  });

  it("sets the period with the P key and a click in 12-hour mode", () => {
    const onValueChange = vi.fn();
    render(<Fixture value="09:00" hourCycle={12} onValueChange={onValueChange} />);
    expect(seg("AM/PM")).toHaveTextContent("AM");
    fireEvent.keyDown(seg("AM/PM"), { key: "p" });
    expect(seg("AM/PM")).toHaveTextContent("PM");
    expect(onValueChange).toHaveBeenLastCalledWith("21:00");
    fireEvent.click(seg("AM/PM"));
    expect(onValueChange).toHaveBeenLastCalledWith("09:00");
  });

  it("reports the finished value when focus leaves the field, once", () => {
    const onValueCommit = vi.fn();
    render(<Fixture value="09:30" onValueCommit={onValueCommit} />);
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    fireEvent.blur(seg("minute"), { relatedTarget: seg("hour") });
    expect(onValueCommit).not.toHaveBeenCalled();
    const after = screen.getByRole("button", { name: "after" });
    fireEvent.blur(seg("minute"), { relatedTarget: after });
    expect(onValueCommit.mock.calls).toEqual([["09:31"]]);
    fireEvent.blur(seg("minute"), { relatedTarget: after });
    expect(onValueCommit).toHaveBeenCalledTimes(1);
  });

  it("puts the segments back on Escape, and passes Escape on with nothing to undo", () => {
    render(<Fixture value="09:30" />);
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("31");
    fireEvent.keyDown(seg("minute"), { key: "Escape" });
    expect(seg("minute")).toHaveTextContent("30");
    expect(fireEvent.keyDown(seg("minute"), { key: "Escape" })).toBe(true);
  });

  it("reports a time outside min without correcting it, also when reached by editing", () => {
    const { unmount } = render(<Fixture value="08:30" min="09:00" />);
    expect(screen.getByText("Enter a time no earlier than 09:00.")).toBeVisible();
    expect(seg("hour")).toHaveTextContent("08");
    unmount();
    render(<Fixture value="09:30" max="10:00" />);
    expect(screen.queryByText(/no later than/)).toBeNull();
    fireEvent.keyDown(seg("hour"), { key: "ArrowUp" });
    fireEvent.keyDown(seg("hour"), { key: "ArrowUp" });
    expect(seg("hour")).toHaveTextContent("11");
    expect(screen.getByText("Enter a time no later than 10:00.")).toBeVisible();
  });

  it("shows an error text from the page and marks the field invalid", () => {
    render(<Fixture value="09:30" error="Pick a slot during opening hours." />);
    expect(group()).toHaveAttribute("aria-invalid", "true");
    expect(group()).toHaveClass("time-field--invalid");
    expect(group()).toHaveAccessibleDescription("Pick a slot during opening hours.");
  });

  it("does not edit a disabled field", () => {
    const onValueChange = vi.fn();
    render(<Fixture value="09:30" disabled onValueChange={onValueChange} />);
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("30");
    expect(seg("minute")).toHaveAttribute("tabindex", "-1");
    expect(group()).toHaveAttribute("aria-disabled", "true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("is disabled inside a disabled fieldset", () => {
    const onValueChange = vi.fn();
    render(
      <form>
        <fieldset disabled>
          <TimeField
            label="Start time"
            hourCycle={24}
            value="09:30"
            name="start"
            onValueChange={onValueChange}
          />
        </fieldset>
      </form>,
    );
    expect(group()).toHaveClass("time-field--disabled");
    expect(seg("minute")).toHaveAttribute("tabindex", "-1");
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(onValueChange).not.toHaveBeenCalled();
    expect([...new FormData(document.querySelector("form")!).keys()]).toEqual([]);
  });

  it("reports a validation change only for an edit, never for a value from outside", () => {
    const onValidationChange = vi.fn();
    const { rerender } = render(<Fixture value="25:00" onValidationChange={onValidationChange} />);
    rerender(<Fixture value="09:72" onValidationChange={onValidationChange} />);
    expect(screen.getByText("Enter a time within the allowed range.")).toBeInTheDocument();
    expect(onValidationChange).not.toHaveBeenCalled();
    fireEvent.keyDown(seg("hour"), { key: "1" });
    expect(onValidationChange.mock.calls).toEqual([[null]]);
    fireEvent.keyDown(seg("hour"), { key: "0" });
    expect(onValidationChange).toHaveBeenCalledTimes(1);
  });

  it("reflects a controlled value without reporting, and a give-back changes nothing", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Fixture value="09:30" onValueChange={onValueChange} />);
    rerender(<Fixture value="10:15" onValueChange={onValueChange} />);
    expect(seg("hour")).toHaveTextContent("10");
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    rerender(<Fixture value="10:16" onValueChange={onValueChange} />);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(seg("minute")).toHaveTextContent("16");
    // The echo was accepted: Escape has nothing to put back.
    expect(fireEvent.keyDown(seg("minute"), { key: "Escape" })).toBe(true);
  });

  it("settles on a value a controlled page writes back", () => {
    function PutBack() {
      const [value, setValue] = useState<string | null>("09:30");
      return <Fixture value={value} onValueChange={() => setValue("12:00")} />;
    }
    render(<PutBack />);
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("hour")).toHaveTextContent("12");
    expect(seg("minute")).toHaveTextContent("00");
  });

  it("takes segment labels from the provider's catalog", () => {
    render(
      <LocaleProvider
        locale="en"
        messages={{ "timeField.hour": "Hours", "timeField.label": "When" }}
      >
        <TimeField hourCycle={24} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("group", { name: "When" })).toBeInTheDocument();
    expect(seg("hours")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Fixture value="09:30" hourCycle={12} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React TimeField in a form", () => {
  const formOf = () => document.querySelector("form")!;
  const entries = () => [...new FormData(formOf()).entries()];

  it("submits the canonical time under its name, nothing without one or while disabled", () => {
    const { rerender } = render(
      <form>
        <TimeField label="Start time" hourCycle={12} value="21:30" name="start" />
      </form>,
    );
    expect(entries()).toEqual([["start", "21:30"]]);
    rerender(
      <form>
        <TimeField label="Start time" hourCycle={12} value="21:30" name="start" disabled />
      </form>,
    );
    expect(entries()).toEqual([]);
    rerender(
      <form>
        <TimeField label="Start time" hourCycle={12} value="21:30" />
      </form>,
    );
    expect(entries()).toEqual([]);
  });

  it("puts the current default back on reset, quietly, and Escape keeps it", async () => {
    const onValueChange = vi.fn();
    const onValidationChange = vi.fn();
    render(
      <form>
        <Fixture
          value="09:30"
          name="start"
          onValueChange={onValueChange}
          onValidationChange={onValidationChange}
        />
      </form>,
    );
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    onValueChange.mockClear();
    formOf().reset();
    await settle();
    expect(seg("minute")).toHaveTextContent("30");
    expect(entries()).toEqual([["start", "09:30"]]);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValidationChange).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(seg("minute"), { key: "Escape" })).toBe(true);
  });

  it("adopts a page's own value as the default, never an echo", async () => {
    function Page() {
      const [value, setValue] = useState<string | null>("09:30");
      return (
        <form>
          <Fixture value={value} name="start" onValueChange={setValue} />
          <button type="button" onClick={() => setValue("11:00")}>
            set
          </button>
        </form>
      );
    }
    render(<Page />);
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    formOf().reset();
    await settle();
    expect(seg("minute")).toHaveTextContent("30");
    fireEvent.click(screen.getByRole("button", { name: "set" }));
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    formOf().reset();
    await settle();
    expect(seg("hour")).toHaveTextContent("11");
    expect(seg("minute")).toHaveTextContent("00");
  });
});
