import { render, screen, fireEvent } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CheckboxGroup } from "./checkbox-group/CheckboxGroup";
import { PinInput } from "./pin-input/PinInput";
import { RadioGroup } from "./radio-group/RadioGroup";
import { RatingGroup } from "./rating-group/RatingGroup";
import { SegmentedControl } from "./segmented-control/SegmentedControl";
import { Slider } from "./slider/Slider";
import { Switch } from "./switch/Switch";
import { TextField } from "./text-field/TextField";
import { TimeField } from "./time-field/TimeField";
import { ToggleButton } from "./toggle-button/ToggleButton";

// The same conventions as the Svelte suite, over the same controls: the point
// of ADR 0011 is that both adapters behave alike, so both are asked the same
// three questions.

interface Case {
  name: string;
  Component: unknown;
  props: Record<string, unknown>;
  callback: string;
  /** The controlled prop's name, for the give-back check. */
  prop: string;
  /** What the starting props read as. */
  reads: string;
  /** The controlled prop's name, for the give-back check. */
  prop: string;
  change: { props: Record<string, unknown>; reads: string };
  read: () => string;
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
    reads: "false",
    Component: Switch,
    props: { label: "Wifi", checked: false },
    prop: "checked",
    prop: "checked",
    callback: "onCheckedChange",
    change: { props: { checked: true }, reads: "true" },
    read: () => String((screen.getByRole("switch") as HTMLInputElement).checked),
    act: async (user) => user.click(screen.getByRole("switch")),
  },
  {
    name: "RadioGroup",
    reads: "free",
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
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: "pro" }, reads: "pro" },
    read: checkedRadio,
    act: async (user) => user.click(screen.getByRole("radio", { name: "Pro" })),
  },
  {
    name: "CheckboxGroup",
    reads: "ham",
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
    reads: "10",
    Component: Slider,
    props: { label: "Volume", value: 10 },
    prop: "value",
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: 60 }, reads: "60" },
    read: () => (screen.getByRole("slider") as HTMLInputElement).value,
    act: async () => {
      const input = screen.getByRole("slider") as HTMLInputElement;
      await fireEvent.update(input, "20");
    },
  },
  {
    name: "PinInput",
    reads: "",
    Component: PinInput,
    props: { label: "Code", value: "", length: 4 },
    prop: "value",
    prop: "value",
    callback: "onValueChange",
    // Shorter than the field: the spare cells have to be cleared.
    change: { props: { value: "22" }, reads: "22" },
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
    reads: "1",
    Component: RatingGroup,
    props: { label: "Stars", value: 1, max: 5 },
    prop: "value",
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: 4 }, reads: "4" },
    read: checkedRadio,
    act: async (user) => user.click(screen.getAllByRole("radio")[2]),
  },
  {
    name: "SegmentedControl",
    reads: "list",
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
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: "board" }, reads: "board" },
    read: checkedRadio,
    act: async (user) => user.click(screen.getByRole("radio", { name: "Board" })),
  },
  {
    name: "ToggleButton",
    reads: "false",
    Component: ToggleButton,
    props: { label: "Bold", pressed: false },
    prop: "pressed",
    prop: "pressed",
    callback: "onPressedChange",
    change: { props: { pressed: true }, reads: "true" },
    read: () => String((screen.getByRole("checkbox") as HTMLInputElement).checked),
    act: async (user) => user.click(screen.getByRole("checkbox")),
  },
  {
    name: "TimeField",
    reads: "09:30",
    Component: TimeField,
    props: { label: "Time", value: "09:30" },
    prop: "value",
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: "11:45" }, reads: "11:45" },
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
    reads: "Ada",
    Component: TextField,
    props: { label: "Name", value: "Ada" },
    prop: "value",
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
    expect(entry.read()).toBe(entry.change.reads);
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
