import { render, screen, fireEvent } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import * as adapter from "./index";

import { CheckboxGroup } from "./checkbox-group/CheckboxGroup";
import { PinInput } from "./pin-input/PinInput";
import { RadioGroup } from "./radio-group/RadioGroup";
import { RatingGroup } from "./rating-group/RatingGroup";
import { SegmentedControl } from "./segmented-control/SegmentedControl";
import { Slider } from "./slider/Slider";
import { RangeSlider } from "./range-slider/RangeSlider";
import { Switch } from "./switch/Switch";
import { TextField } from "./text-field/TextField";
import { TimeField } from "./time-field/TimeField";
import { ToggleButton } from "./toggle-button/ToggleButton";
import { Dialog } from "./dialog/Dialog";
import { AlertDialog } from "./alert-dialog/AlertDialog";
import { ConfirmDialog } from "./confirm-dialog/ConfirmDialog";
import { SheetDialog } from "./sheet-dialog/SheetDialog";
import { Popover } from "./popover/Popover";

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
    act: async () => {
      const input = screen.getByRole("slider") as HTMLInputElement;
      await fireEvent.update(input, "20");
    },
  },
  {
    name: "RangeSlider",
    reads: "20,80",
    Component: RangeSlider,
    props: {
      label: "Price",
      thumbLabels: ["Minimum price", "Maximum price"],
      value: [20, 80],
    },
    prop: "value",
    callback: "onValueChange",
    change: { props: { value: [30, 70] }, reads: "30,70" },
    read: () =>
      screen
        .getAllByRole("slider")
        .map((thumb) => (thumb as HTMLInputElement).value)
        .join(","),
    act: async () => {
      const lower = screen.getByRole("slider", { name: "Minimum price" });
      await fireEvent.update(lower, "35");
    },
  },
  {
    name: "PinInput",
    reads: "",
    Component: PinInput,
    props: { label: "Code", value: "", length: 4 },
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
    expect(fresh, "the callback in force must be called exactly once").toHaveBeenCalledTimes(1);
  });

  it("does not churn when a controlled parent echoes the value back", async () => {
    const reported = vi.fn();
    const { rerender } = render(entry.Component as never, {
      props: { ...entry.props, [entry.callback]: reported },
    });

    const user = userEvent.setup();
    await entry.act(user);
    // One user action, one call (ADR 0011): pinning this to a literal 1, not a
    // captured `timesBefore`, is what makes a double-report fail right here
    // instead of only "not growing further" against its own already-wrong count.
    expect(reported).toHaveBeenCalledTimes(1);
    const reportedValue = reported.mock.calls.at(-1)?.[0];

    // A controlled parent hands the reported value straight back, as a fresh
    // object where the value is one: reflecting it must report nothing.
    const echoed = Array.isArray(reportedValue) ? [...reportedValue] : reportedValue;
    await rerender({ ...entry.props, [entry.prop]: echoed, [entry.callback]: reported });
    expect(reported).toHaveBeenCalledTimes(1);
  });
});

// Nothing may be forgotten silently: every component the package exports is
// either a case above or named here with the reason it is not. A component
// added to the package without a line in either place fails this test.
const NOT_A_CASE: Record<string, string> = {
  // No value a consumer controls: display, layout, or a single action.
  Icon: "display only",
  HoverCard: "no conventions case yet: docs/state-ownership-audit.md",
  Menu: "a legacy name for Sidebar (ADR 0013); Sidebar is listed",
  FeedbackIcon: "display only",
  ErrorState: "display only",
  EmptyState: "display only",
  LoadingGenerationArea: "display only",
  Button: "an action, no controlled value",
  ButtonGroup: "layout only",
  InlineNotification: "display only; its close is an action",
  Separator: "display only",
  Toolbar: "layout only",
  Avatar: "display only",
  AvatarGroup: "display only",
  Card: "layout only",
  Skeleton: "display only",
  Loading: "display only",
  LocaleProvider: "context, no value of its own",
  Tag: "display only",
  Count: "display only",
  Code: "display only",
  CodeBlock: "display only; copy is an action",
  Blockquote: "display only",
  Kbd: "display only",
  Link: "navigation, no controlled value",
  Breadcrumb: "navigation, no controlled value",
  Label: "display only",
  Field: "layout only",
  AspectRatio: "layout only",
  Progress: "display of a value the page owns; no callback",
  Meter: "display of a value the page owns; no callback",
  ScrollArea: "layout only",
  Notification: "display only",
  NotificationRegion: "display only",
  Stepper: "display of a step the page owns; no callback",
  // Covered by their own suites, named here so the coverage is findable.
  Pagination: "pagination.test.ts holds reflection, silence and the live callback",
  // Named omissions: controls with a controlled value and no case written
  // yet. Every name here is listed in the audit the reason points at, and
  // the last test in this file checks that it is.
  Checkbox: "no conventions case yet: docs/state-ownership-audit.md",
  Radio: "no conventions case yet: docs/state-ownership-audit.md",
  Textarea: "no conventions case yet: docs/state-ownership-audit.md",
  ToggleGroup: "no conventions case yet: docs/state-ownership-audit.md",
  Tabs: "no conventions case yet: docs/state-ownership-audit.md",
  Accordion: "no conventions case yet: docs/state-ownership-audit.md",
  Collapsible: "no conventions case yet: docs/state-ownership-audit.md",
  Select: "no conventions case yet: docs/state-ownership-audit.md",
  Combobox: "no conventions case yet: docs/state-ownership-audit.md",
  MultiSelect: "no conventions case yet: docs/state-ownership-audit.md",
  Calendar: "no conventions case yet: docs/state-ownership-audit.md",
  DatePicker: "no conventions case yet: docs/state-ownership-audit.md",
  DateRangePicker: "no conventions case yet: docs/state-ownership-audit.md",
  NumberField: "no conventions case yet: docs/state-ownership-audit.md",
  Carousel: "no conventions case yet: docs/state-ownership-audit.md",
  TreeView: "no conventions case yet: docs/state-ownership-audit.md",
  UploadDropArea: "no conventions case yet: docs/state-ownership-audit.md",
  LoginForm: "no conventions case yet: docs/state-ownership-audit.md",
  Sidebar: "gap (Lot 5); openGroups is a documented exception (ADR 0013)",
  Tooltip: "no conventions case yet: docs/state-ownership-audit.md",
  PromptDialog: "no conventions case yet: docs/state-ownership-audit.md",
  SearchDialog: "no conventions case yet: docs/state-ownership-audit.md",
  DropdownMenu: "no conventions case yet: docs/state-ownership-audit.md",
  ContextMenu: "no conventions case yet: docs/state-ownership-audit.md",
  Menubar: "no conventions case yet: docs/state-ownership-audit.md",
  NavigationMenu: "no conventions case yet: docs/state-ownership-audit.md",
  Table: "no conventions case yet: docs/state-ownership-audit.md",
  TableSet: "controlled props not followed today: docs/state-ownership-audit.md, Task 5A",
};

// The `open` family is a controllable mirror too, and reflecting it used to
// report: a parent that opened a dialog was told about a change it made
// itself. There is no user action to compare here, so the rule under test is
// the silence. The Svelte twin of this block is in
// packages/svelte/src/lib/adr-0011-conventions.test.ts.
describe.each([
  ["Dialog", Dialog, { title: "Edit" }],
  ["AlertDialog", AlertDialog, { title: "Careful", description: "This cannot be undone." }],
  ["ConfirmDialog", ConfirmDialog, { title: "Delete?", description: "It goes for good." }],
  ["SheetDialog", SheetDialog, { title: "Filters" }],
  ["Popover", Popover, { label: "More" }],
])("%s reflects open without reporting", (_name, Component, extra) => {
  it("opens from the outside in silence", async () => {
    const reported = vi.fn();
    const { rerender } = render(Component as never, {
      props: { ...extra, open: false, "onUpdate:open": reported, onOpenChange: reported },
    });
    await rerender({ ...extra, open: true, "onUpdate:open": reported, onOpenChange: reported });
    expect(reported).not.toHaveBeenCalled();
  });

  it("closes from the outside in silence", async () => {
    const reported = vi.fn();
    const { rerender } = render(Component as never, {
      props: { ...extra, open: true, "onUpdate:open": reported, onOpenChange: reported },
    });
    await rerender({ ...extra, open: false, "onUpdate:open": reported, onOpenChange: reported });
    expect(reported).not.toHaveBeenCalled();
  });
});

// What the block above asserts, named so the gate below counts it: it is not
// a `cases` entry, because there is no user action to compare.
const OPEN_MIRRORS_COVER = ["Dialog", "AlertDialog", "ConfirmDialog", "SheetDialog", "Popover"];

describe("the ADR 0011 gate knows every exported component", () => {
  it("lists each one as a case or as a named omission, and nothing twice", () => {
    // A component is an object or a function here: a functional component is
    // a plain function, and leaving those out let one slip past this gate.
    const exported = Object.keys(adapter).filter((name) => {
      if (!/^[A-Z]/.test(name)) return false;
      const value = adapter[name as keyof typeof adapter];
      return typeof value === "object" || typeof value === "function";
    });
    const covered = new Set([...cases.map((entry) => entry.name), ...OPEN_MIRRORS_COVER]);
    const missing = exported.filter((name) => !covered.has(name) && !(name in NOT_A_CASE));
    expect(missing, "exported components with neither a case nor a reason").toEqual([]);
    const stale = Object.keys(NOT_A_CASE).filter(
      (name) => !exported.includes(name) || covered.has(name),
    );
    expect(stale, "omissions that no longer exist or are covered after all").toEqual([]);
  });

  // A reason that points at a document is only worth the document saying so.
  it("finds every named omission in the audit its reason points at", () => {
    const audit = readFileSync(
      resolve(process.cwd(), "../../docs/state-ownership-audit.md"),
      "utf8",
    );
    const listed = Object.entries(NOT_A_CASE)
      .filter(([, reason]) => reason.startsWith("no conventions case yet:"))
      .map(([name]) => name);
    expect(listed.length, "the reason is used at all").toBeGreaterThan(0);
    const absent = listed.filter((name) => !new RegExp(`^- ${name}$`, "m").test(audit));
    expect(absent, "named in the test, missing from the audit").toEqual([]);
  });
});
