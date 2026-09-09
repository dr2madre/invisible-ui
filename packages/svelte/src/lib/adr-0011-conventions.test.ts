import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import CheckboxGroup from "./checkbox-group/CheckboxGroup.svelte";
import PinInput from "./pin-input/PinInput.svelte";
import RadioGroup from "./radio-group/RadioGroup.svelte";
import RatingGroup from "./rating-group/RatingGroup.svelte";
import SegmentedControl from "./segmented-control/SegmentedControl.svelte";
import Slider from "./slider/Slider.svelte";
import SwitchControl from "./switch/Switch.svelte";
import TextField from "./text-field/TextField.svelte";
import TimeField from "./time-field/TimeField.svelte";
import ToggleButton from "./toggle-button/ToggleButton.svelte";

// The conventions in ADR 0011, asserted once for every control that owns a
// value a consumer can control. Three rules, per control:
//
//   reflection    a changed prop reaches the control
//   silence       reflecting a prop reports nothing
//   live callback the callback in force at the time of the action is the one
//                 that is called, not the one the control was mounted with
//
// Each control says how to read its own value from the page and how a user
// changes it, because that part is not shared.

interface Case {
  name: string;
  Component: unknown;
  props: Record<string, unknown>;
  callback: string;
  /** The controlled prop's name, for the give-back check. */
  prop: string;
  /** A different value for the controlled prop, and how it should read. */
  change: { props: Record<string, unknown>; reads: string };
  /** What the control shows now. */
  read: () => string;
  /** One user action that reports a change. */
  act: (user: ReturnType<typeof userEvent.setup>) => Promise<void>;
}

const checkedRadio = () =>
  (
    screen.getAllByRole("radio").find((radio) => radio.getAttribute("aria-checked") === "true") ??
    screen.getAllByRole("radio").find((radio) => (radio as HTMLInputElement).checked)
  )?.getAttribute("value") ?? "(none)";

const cases: Case[] = [
  {
    name: "Switch",
    Component: SwitchControl,
    props: { label: "Wifi", checked: false },
    prop: "checked",
    callback: "onCheckedChange",
    change: { props: { checked: true }, reads: "true" },
    // A native checkbox with role="switch": the state is the property.
    read: () => String((screen.getByRole("switch") as HTMLInputElement).checked),
    act: async (user) => user.click(screen.getByRole("switch")),
  },
  {
    name: "RadioGroup",
    Component: RadioGroup,
    props: {
      label: "Plan",
      value: "free",
      items: [
        { value: "free", label: "Free" },
        { value: "pro", label: "Pro" },
      ],
    },
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: "pro" }, reads: "pro" },
    read: checkedRadio,
    act: async (user) => user.click(screen.getByRole("radio", { name: "Pro" })),
  },
  {
    name: "CheckboxGroup",
    Component: CheckboxGroup,
    props: {
      label: "Toppings",
      value: ["ham"],
      items: [
        { value: "ham", label: "Ham" },
        { value: "olive", label: "Olive" },
      ],
    },
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: ["olive"] }, reads: "olive" },
    read: () =>
      screen
        .getAllByRole("checkbox")
        .filter((box) => (box as HTMLInputElement).checked)
        .map((box) => (box as HTMLInputElement).value)
        .join(",") || "(none)",
    act: async (user) => user.click(screen.getByRole("checkbox", { name: "Olive" })),
  },
  {
    name: "Slider",
    Component: Slider,
    props: { label: "Volume", value: 10 },
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: 60 }, reads: "60" },
    read: () => (screen.getByRole("slider") as HTMLInputElement).value,
    // A range input's arrow keys are the browser's own, not this environment's:
    // the input event is the same path the component listens to.
    act: async () => {
      const input = screen.getByRole("slider") as HTMLInputElement;
      await fireEvent.input(input, { target: { value: "20" } });
    },
  },
  {
    name: "PinInput",
    Component: PinInput,
    // Starts empty: a full cell cannot take another character, so typing into
    // one would report nothing at all.
    props: { label: "Code", value: "", length: 4 },
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: "2222" }, reads: "2222" },
    read: () =>
      screen
        .getAllByRole("textbox")
        .map((cell) => (cell as HTMLInputElement).value)
        .join(""),
    act: async (user) => {
      const cells = screen.getAllByRole("textbox");
      await user.click(cells[0]);
      await user.keyboard("9");
    },
  },
  {
    name: "RatingGroup",
    Component: RatingGroup,
    props: { label: "Stars", value: 1, max: 5 },
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: 4 }, reads: "4" },
    read: checkedRadio,
    act: async (user) => user.click(screen.getAllByRole("radio")[2]),
  },
  {
    name: "SegmentedControl",
    Component: SegmentedControl,
    props: {
      label: "View",
      value: "list",
      items: [
        { value: "list", label: "List" },
        { value: "board", label: "Board" },
      ],
    },
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: "board" }, reads: "board" },
    read: checkedRadio,
    act: async (user) => user.click(screen.getByRole("radio", { name: "Board" })),
  },
  {
    name: "ToggleButton",
    Component: ToggleButton,
    props: { label: "Bold", pressed: false },
    prop: "pressed",
    callback: "onPressedChange",
    change: { props: { pressed: true }, reads: "true" },
    // A checkbox styled as a button: the browser owns the role and the state.
    read: () => String((screen.getByRole("checkbox") as HTMLInputElement).checked),
    act: async (user) => user.click(screen.getByRole("checkbox")),
  },
  {
    name: "TimeField",
    Component: TimeField,
    props: { label: "Time", value: "09:30" },
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: "11:45" }, reads: "11:45" },
    // Segmented spinbuttons, so the value reads from the segments themselves.
    read: () =>
      screen
        .getAllByRole("spinbutton")
        .map((segment) => segment.textContent?.trim() ?? "")
        .join(":"),
    act: async () => {
      const minute = screen.getByRole("spinbutton", { name: /^minute$/i });
      await fireEvent.keyDown(minute, { key: "ArrowUp" });
    },
  },
  {
    name: "TextField",
    Component: TextField,
    props: { label: "Name", value: "Ada" },
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: "Grace" }, reads: "Grace" },
    read: () => (screen.getByRole("textbox") as HTMLInputElement).value,
    act: async (user) => user.type(screen.getByRole("textbox"), "!"),
  },
];

describe.each(cases)("$name follows the ADR 0011 conventions", (entry) => {
  it("reflects a changed value prop", async () => {
    const { rerender } = render(entry.Component as never, { props: { ...entry.props } });
    await rerender({ ...entry.props, ...entry.change.props });
    expect(entry.read()).toContain(entry.change.reads);
  });

  it("reports nothing while reflecting", async () => {
    const reported = vi.fn();
    const { rerender } = render(entry.Component as never, {
      props: { ...entry.props, [entry.callback]: reported },
    });
    await rerender({ ...entry.props, ...entry.change.props, [entry.callback]: reported });
    expect(reported).not.toHaveBeenCalled();
  });

  it("calls the callback it has now, not the one it was mounted with", async () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = render(entry.Component as never, {
      props: { ...entry.props, [entry.callback]: stale },
    });
    await rerender({ ...entry.props, [entry.callback]: fresh });

    const user = userEvent.setup();
    await entry.act(user);

    expect(stale, "the callback it was mounted with must not be called").not.toHaveBeenCalled();
    expect(fresh, "the callback in force must be").toHaveBeenCalled();
  });

  it("does not churn when a controlled parent echoes the value back", async () => {
    const reported = vi.fn();
    const { rerender } = render(entry.Component as never, {
      props: { ...entry.props, [entry.callback]: reported },
    });

    const user = userEvent.setup();
    await entry.act(user);
    expect(reported).toHaveBeenCalled();
    const reportedValue = reported.mock.calls.at(-1)?.[0];
    const timesBefore = reported.mock.calls.length;

    // A controlled parent hands the reported value straight back, as a fresh
    // object where the value is one: reflecting it must report nothing.
    const echoed = Array.isArray(reportedValue) ? [...reportedValue] : reportedValue;
    await rerender({ ...entry.props, [entry.prop]: echoed, [entry.callback]: reported });
    expect(reported).toHaveBeenCalledTimes(timesBefore);
  });
});
