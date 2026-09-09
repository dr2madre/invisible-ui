import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Accordion from "./accordion/Accordion.svelte";
import AlertDialog from "./alert-dialog/AlertDialog.svelte";
import Collapsible from "./collapsible/Collapsible.svelte";
import Stepper from "./stepper/Stepper.svelte";
import TreeView from "./tree-view/TreeView.svelte";
import CheckboxGroup from "./checkbox-group/CheckboxGroup.svelte";
import ConfirmDialog from "./confirm-dialog/ConfirmDialog.svelte";
import DialogComponent from "./dialog/Dialog.svelte";
import Popover from "./popover/Popover.svelte";
import SheetDialog from "./sheet-dialog/SheetDialog.svelte";
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
  /** What the starting props read as. */
  reads: string;
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
    reads: "false",
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
    reads: "",
    Component: PinInput,
    // Starts empty: a full cell cannot take another character, so typing into
    // one would report nothing at all.
    props: { label: "Code", value: "", length: 4 },
    prop: "value",
    callback: "onValueChange",
    // Shorter than the field: the spare cells have to be cleared, which is
    // half of what reflecting a value means here.
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
    callback: "onPressedChange",
    change: { props: { pressed: true }, reads: "true" },
    // A checkbox styled as a button: the browser owns the role and the state.
    read: () => String((screen.getByRole("checkbox") as HTMLInputElement).checked),
    act: async (user) => user.click(screen.getByRole("checkbox")),
  },
  {
    name: "TimeField",
    reads: "09:30",
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
    reads: "Ada",
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

// A control can render the prop while its own machine keeps a different copy.
// Nothing above can see that: the page shows the reflected value either way.
// What gives it away is the user producing the value the machine still holds.
describe("a reflected value becomes the control's own", () => {
  it("the text field reports a user retyping the value it used to hold", async () => {
    const reported = vi.fn();
    const { rerender } = render(TextField, {
      props: { label: "Name", value: "Ada", onValueChange: reported },
    });
    await rerender({ label: "Name", value: "Grace", onValueChange: reported });

    // In one step, the way a paste or a browser autofill arrives: typing it
    // character by character would pass through values the machine does not
    // hold and report on the way.
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "Ada" } });

    // Without a mirror the machine still says "Ada", so this reports nothing
    // and the consumer never learns the field went back.
    expect(reported).toHaveBeenCalledWith("Ada");
  });
});

// The `open` family is a controllable mirror too, and reflecting it used to
// report: a parent that opened a dialog was told about a change it made
// itself. There is no user action to compare here, so the rule under test is
// the silence.
describe.each([
  ["Dialog", DialogComponent, { title: "Edit" }],
  ["AlertDialog", AlertDialog, { title: "Careful", description: "This cannot be undone." }],
  ["ConfirmDialog", ConfirmDialog, { title: "Delete?", description: "It goes for good." }],
  ["SheetDialog", SheetDialog, { title: "Filters" }],
  ["Popover", Popover, { label: "More" }],
])("%s reflects open without reporting", (_name, Component, extra) => {
  it("opens from the outside in silence", async () => {
    const reported = vi.fn();
    const { rerender } = render(Component as never, {
      props: { ...extra, open: false, onOpenChange: reported },
    });
    await rerender({ ...extra, open: true, onOpenChange: reported });
    expect(reported).not.toHaveBeenCalled();
  });

  it("closes from the outside in silence", async () => {
    const reported = vi.fn();
    const { rerender } = render(Component as never, {
      props: { ...extra, open: true, onOpenChange: reported },
    });
    await rerender({ ...extra, open: false, onOpenChange: reported });
    expect(reported).not.toHaveBeenCalled();
  });
});

// Controls whose value is not what a form submits, but is still the
// consumer's to hold: the same three rules, read off what each one shows.
describe("more controllable mirrors", () => {
  it("the collapsible opens from the outside in silence", async () => {
    const reported = vi.fn();
    const { rerender } = render(Collapsible, {
      props: { label: "Details", open: false, onOpenChange: reported },
    });
    await rerender({ label: "Details", open: true, onOpenChange: reported });
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
    expect(reported).not.toHaveBeenCalled();
  });

  it("the accordion reflects a changed value in silence", async () => {
    const items = [
      { value: "one", label: "One" },
      { value: "two", label: "Two" },
    ];
    const reported = vi.fn();
    const { rerender } = render(Accordion, {
      props: { items, value: ["one"], onValueChange: reported },
    });
    await rerender({ items, value: ["two"], onValueChange: reported });
    const expanded = screen
      .getAllByRole("button")
      .filter((trigger) => trigger.getAttribute("aria-expanded") === "true")
      .map((trigger) => trigger.textContent?.trim());
    expect(expanded).toEqual(["Two"]);
    expect(reported).not.toHaveBeenCalled();
  });

  it("the stepper reflects a changed step in silence", async () => {
    const steps = [{ label: "One" }, { label: "Two" }, { label: "Three" }];
    const reported = vi.fn();
    const { rerender } = render(Stepper, {
      props: { steps, current: 0, onStepChange: reported },
    });
    await rerender({ steps, current: 2, onStepChange: reported });
    expect(screen.getAllByRole("listitem").map((step) => step.getAttribute("data-status"))).toEqual(
      ["complete", "complete", "current"],
    );
    expect(reported).not.toHaveBeenCalled();
  });

  it("the tree reflects a changed selection in silence", async () => {
    const nodes = [{ value: "fruits", children: [{ value: "apple" }] }, { value: "roots" }];
    const reported = vi.fn();
    const { rerender } = render(TreeView, {
      props: { label: "Produce", nodes, selected: "roots", onSelectedChange: reported },
    });
    await rerender({ label: "Produce", nodes, selected: "fruits", onSelectedChange: reported });
    const selected = screen
      .getAllByRole("treeitem")
      .filter((item) => item.getAttribute("aria-selected") === "true")
      .map((item) => item.textContent?.trim());
    expect(selected).toEqual(["fruits"]);
    expect(reported).not.toHaveBeenCalled();
  });
});

// ADR 0011 also draws a commit boundary: Escape puts back the committed value.
// A parent that echoes the draft back has accepted it, so there is nothing
// left to revert to but that.
describe("a reflected value is a committed value", () => {
  it("Escape does not revert past what the consumer holds", async () => {
    const committed = vi.fn();
    const { rerender } = render(TimeField, {
      props: { label: "Time", value: "09:30", onValueCommit: committed },
    });
    const minute = screen.getByRole("spinbutton", { name: /^minute$/i });
    await fireEvent.keyDown(minute, { key: "ArrowUp" });
    const drafted = screen
      .getAllByRole("spinbutton")
      .map((segment) => segment.textContent?.trim())
      .join(":");
    expect(drafted).toBe("09:31");

    // The parent takes the draft as its value.
    await rerender({ label: "Time", value: "09:31", onValueCommit: committed });
    await fireEvent.keyDown(minute, { key: "Escape" });

    expect(
      screen
        .getAllByRole("spinbutton")
        .map((segment) => segment.textContent?.trim())
        .join(":"),
      "Escape reverted to a value the consumer had already replaced",
    ).toBe("09:31");
  });
});
