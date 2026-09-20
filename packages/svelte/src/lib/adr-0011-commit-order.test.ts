import { get, type Readable } from "svelte/store";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAccordion } from "./accordion/create-accordion";
import { createCarousel } from "./carousel/create-carousel";
import { createCheckbox } from "./checkbox/create-checkbox";
import { createCheckboxGroup } from "./checkbox-group/create-checkbox-group";
import { createCollapsible } from "./collapsible/create-collapsible";
import { createCombobox } from "./combobox/create-combobox";
import { createContextMenu } from "./context-menu/create-context-menu";
import { createDialog } from "./dialog/create-dialog";
import { createDropdownMenu } from "./dropdown-menu/create-dropdown-menu";
import { createHoverCard } from "./hover-card/create-hover-card";
import { createMultiSelect } from "./multi-select/create-multi-select";
import { createNavigationMenu } from "./navigation-menu/create-navigation-menu";
import { createPagination } from "./pagination/create-pagination";
import { createPinInput } from "./pin-input/create-pin-input";
import { createPopover } from "./popover/create-popover";
import { createRadioGroup } from "./radio-group/create-radio-group";
import { createSelect } from "./select/create-select";
import { createSlider } from "./slider/create-slider";
import { createStepper } from "./stepper/create-stepper";
import { createSwitch } from "./switch/create-switch";
import { createTable } from "./table/create-table";
import { createTabs } from "./tabs/create-tabs";
import { createTextField } from "./text-field/create-text-field";
import { createToggleButton } from "./toggle-button/create-toggle-button";
import { createTooltip } from "./tooltip/create-tooltip";
import { createTreeView } from "./tree-view/create-tree-view";

// ADR 0011, the order of the two things a setter does: the store is written
// first, the callback runs second. Reporting from inside `store.update` hands
// the consumer a store that still holds the old value and swallows anything
// the consumer writes from its own handler: the updater's return value lands
// afterwards and wins. Both are silent, so the order is asserted here for
// every factory that reports a public callback.
//
// Each row builds the factory with a spy in its callback that reads the
// store, performs one change, and says what the store must already hold.

interface Row {
  name: string;
  /** Build with the callback; the spy receives the store to read at report time. */
  build: (spy: (state: Readable<unknown>) => void) => { state: Readable<unknown>; act: () => void };
  /** What the store must read at report time. */
  expected: (state: unknown) => unknown;
  /** The value the change reaches. */
  after: unknown;
}

const items = [{ value: "a" }, { value: "b" }, { value: "c" }];
const labelled = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];

const rows: Row[] = [
  {
    name: "Accordion",
    build: (spy) => {
      const f = createAccordion({ items, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue(["b"]) };
    },
    expected: (s) => (s as { value: string[] }).value,
    after: ["b"],
  },
  {
    name: "CheckboxGroup",
    build: (spy) => {
      const f = createCheckboxGroup({ items, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue(["a"]) };
    },
    expected: (s) => (s as { value: string[] }).value,
    after: ["a"],
  },
  {
    name: "Checkbox",
    build: (spy) => {
      const f = createCheckbox({ onCheckedChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setChecked(true) };
    },
    expected: (s) => (s as { checked: unknown }).checked,
    after: true,
  },
  {
    name: "Collapsible",
    build: (spy) => {
      const f = createCollapsible({ onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
  },
  {
    name: "Combobox value",
    build: (spy) => {
      const f = createCombobox({ items: labelled, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("b") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "b",
  },
  {
    name: "Combobox open",
    build: (spy) => {
      const f = createCombobox({ items: labelled, onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
  },
  {
    name: "Dialog",
    build: (spy) => {
      const f = createDialog({ onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
  },
  {
    name: "HoverCard",
    build: (spy) => {
      const f = createHoverCard({ onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
  },
  {
    name: "MultiSelect values",
    build: (spy) => {
      const f = createMultiSelect({ items: labelled, onValuesChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValues(["a"]) };
    },
    expected: (s) => (s as { values: string[] }).values,
    after: ["a"],
  },
  {
    name: "MultiSelect open",
    build: (spy) => {
      const f = createMultiSelect({ items: labelled, onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
  },
  {
    name: "NavigationMenu",
    build: (spy) => {
      const f = createNavigationMenu({ onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("docs") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "docs",
  },
  {
    name: "Pagination",
    build: (spy) => {
      const f = createPagination({ page: 1, pageCount: 3, onPageChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setPage(2) };
    },
    expected: (s) => (s as { page: number }).page,
    after: 2,
  },
  {
    name: "PinInput",
    build: (spy) => {
      const f = createPinInput({ length: 2, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValues(["1", ""]) };
    },
    expected: (s) => (s as { values: string[] }).values,
    after: ["1", ""],
  },
  {
    name: "Popover",
    build: (spy) => {
      const f = createPopover({ onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
  },
  {
    name: "RadioGroup",
    build: (spy) => {
      const f = createRadioGroup({ items, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("b") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "b",
  },
  {
    name: "Select",
    build: (spy) => {
      const f = createSelect({ items: labelled, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("b") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "b",
  },
  {
    name: "Slider",
    build: (spy) => {
      const f = createSlider({ value: 10, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue(20) };
    },
    expected: (s) => (s as { value: number }).value,
    after: 20,
  },
  {
    name: "Switch",
    build: (spy) => {
      const f = createSwitch({ onCheckedChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setChecked(true) };
    },
    expected: (s) => (s as { checked: boolean }).checked,
    after: true,
  },
  {
    name: "Table sort",
    build: (spy) => {
      const f = createTable({
        columns: [{ key: "name", sortable: true }],
        onSortChange: () => spy(f.state),
      });
      return { state: f.state, act: () => f.setSort({ key: "name", direction: "asc" }) };
    },
    expected: (s) => (s as { sort: unknown }).sort,
    after: { key: "name", direction: "asc" },
  },
  {
    name: "Tabs",
    build: (spy) => {
      const f = createTabs({ items, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("b") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "b",
  },
  {
    name: "TextField",
    build: (spy) => {
      const f = createTextField({ onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("Ada") };
    },
    expected: (s) => (s as { value: string }).value,
    after: "Ada",
  },
  {
    name: "ToggleButton",
    build: (spy) => {
      const f = createToggleButton({ onPressedChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setPressed(true) };
    },
    expected: (s) => (s as { pressed: boolean }).pressed,
    after: true,
  },
  // These report through the api core connects, not through an exported setter.
  {
    name: "Carousel",
    build: (spy) => {
      const f = createCarousel({ count: 3, onIndexChange: () => spy(f.state) });
      return { state: f.state, act: () => f.goTo(1) };
    },
    expected: (s) => (s as { index: number }).index,
    after: 1,
  },
  {
    name: "Stepper",
    build: (spy) => {
      // Linear by default: only the next step is reachable.
      const f = createStepper({ count: 3, onStepChange: () => spy(f.state) });
      return { state: f.state, act: () => f.next() };
    },
    expected: (s) => (s as { current: number }).current,
    after: 1,
  },
  {
    name: "ContextMenu",
    build: (spy) => {
      const f = createContextMenu({ items: labelled, onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => get(f.api).openMenu() };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
  },
  {
    name: "DropdownMenu",
    build: (spy) => {
      const f = createDropdownMenu({ items: labelled, onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => get(f.api).openMenu() };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
  },
  {
    name: "TreeView expanded",
    build: (spy) => {
      const f = createTreeView({
        nodes: [{ value: "a", children: [{ value: "a1" }] }],
        onExpandedChange: () => spy(f.state),
      });
      return { state: f.state, act: () => get(f.api).toggle("a") };
    },
    expected: (s) => (s as { expanded: string[] }).expanded,
    after: ["a"],
  },
  {
    name: "TreeView selected",
    build: (spy) => {
      const f = createTreeView({ nodes: [{ value: "a" }], onSelectedChange: () => spy(f.state) });
      return { state: f.state, act: () => get(f.api).select("a") };
    },
    expected: (s) => (s as { selected: string | null }).selected,
    after: "a",
  },
];

// The tooltip opens from its trigger's events after a delay, so its row runs
// the clock instead of calling a setter.
describe("Tooltip reports after the store write", () => {
  afterEach(() => vi.useRealTimers());
  it("has already committed the change by the time it reports it", () => {
    vi.useFakeTimers();
    let seen: unknown = "(not reported)";
    const f = createTooltip({ openDelay: 10, onOpenChange: () => (seen = get(f.state).open) });
    const trigger = document.createElement("button");
    document.body.append(trigger);
    const action = f.triggerAction(trigger);
    trigger.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    vi.advanceTimersByTime(10);
    expect(seen).toBe(true);
    action?.destroy?.();
    trigger.remove();
  });
});

describe.each(rows)("$name reports after the store write", (row) => {
  it("has already committed the change by the time it reports it", () => {
    let seen: unknown = "(not reported)";
    const { act } = row.build((state) => {
      seen = row.expected(get(state));
    });
    act();
    expect(seen).toEqual(row.after);
  });
});
