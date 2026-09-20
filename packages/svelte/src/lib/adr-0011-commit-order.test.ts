import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { get, type Readable } from "svelte/store";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAccordion } from "./accordion/create-accordion";
import { createCalendar } from "./calendar/create-calendar";
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
import { createNumberField } from "./number-field/create-number-field";
import { createPagination } from "./pagination/create-pagination";
import { createPinInput } from "./pin-input/create-pin-input";
import { createPopover } from "./popover/create-popover";
import { createRadioGroup } from "./radio-group/create-radio-group";
import { createRangeSlider } from "./range-slider/create-range-slider";
import { createRatingGroup } from "./rating-group/create-rating-group";
import { createSelect } from "./select/create-select";
import { createSlider } from "./slider/create-slider";
import { createStepper } from "./stepper/create-stepper";
import { createSwitch } from "./switch/create-switch";
import { createTable } from "./table/create-table";
import { createTabs } from "./tabs/create-tabs";
import { createTextField } from "./text-field/create-text-field";
import { createTimeField } from "./time-field/create-time-field";
import { createToggleButton } from "./toggle-button/create-toggle-button";
import { createTooltip } from "./tooltip/create-tooltip";
import { createTreeView } from "./tree-view/create-tree-view";

// ADR 0011, the order of the two things a setter does: the store is written
// first, the callback runs second. Reporting from inside `store.update` hands
// the consumer a store that still holds the old value and swallows anything
// the consumer writes from its own handler: the updater's return value lands
// afterwards and wins. Both are silent, so the order is asserted here.
//
// Each row builds the factory with a spy in its callback. The first test
// reads the store at report time; the second writes to the store from the
// handler and checks the write survived. The last test in this file reads
// the factory sources and refuses a callback that no row covers.

interface Built {
  state: Readable<unknown>;
  /** The change under test. */
  act: () => void;
  /** A different value, written the way a consumer refusing the change would. */
  putBack?: () => void;
}

interface Row {
  name: string;
  /** The callbacks this row asserts, as "<factory directory>/<callback>". */
  covers: string[];
  build: (spy: (state: Readable<unknown>) => void) => Built;
  /** What the store must read at report time. */
  expected: (state: unknown) => unknown;
  /** The value the change reaches. */
  after: unknown;
  /** What the store must hold once the handler's own write has landed. */
  settled?: unknown;
}

const items = [{ value: "a" }, { value: "b" }, { value: "c" }];
const labelled = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];

/** An input the factory's own action is attached to, as a page would. */
const typed = (attach: (node: HTMLElement) => { destroy?: () => void } | void, text: string) => {
  const input = document.createElement("input");
  document.body.append(input);
  const action = attach(input);
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  action?.destroy?.();
  input.remove();
};

const rows: Row[] = [
  {
    name: "Accordion",
    covers: ["accordion/onValueChange"],
    build: (spy) => {
      const f = createAccordion({ items, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue(["b"]), putBack: () => f.setValue(["c"]) };
    },
    expected: (s) => (s as { value: string[] }).value,
    after: ["b"],
    settled: ["c"],
  },
  {
    name: "Calendar value",
    covers: ["calendar/onValueChange"],
    build: (spy) => {
      const f = createCalendar({ value: "2026-06-15", onValueChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => f.setValue("2026-06-20"),
        putBack: () => f.syncValue("2026-06-01"),
      };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "2026-06-20",
    settled: "2026-06-01",
  },
  {
    name: "Calendar focus",
    covers: ["calendar/onFocusChange"],
    build: (spy) => {
      const f = createCalendar({ focusedDate: "2026-06-15", onFocusChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => f.setFocus("2026-06-20"),
        putBack: () => f.syncFocus("2026-06-01"),
      };
    },
    expected: (s) => (s as { focusedDate: string }).focusedDate,
    after: "2026-06-20",
    settled: "2026-06-01",
  },
  {
    name: "Calendar view",
    covers: ["calendar/onViewChange"],
    build: (spy) => {
      const f = createCalendar({ view: "month", onViewChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setView("year"), putBack: () => f.syncView("month") };
    },
    expected: (s) => (s as { view: string }).view,
    after: "year",
    settled: "month",
  },
  {
    name: "Carousel",
    covers: ["carousel/onIndexChange"],
    build: (spy) => {
      const f = createCarousel({ count: 3, onIndexChange: () => spy(f.state) });
      return { state: f.state, act: () => f.goTo(1), putBack: () => f.goTo(2) };
    },
    expected: (s) => (s as { index: number }).index,
    after: 1,
    settled: 2,
  },
  {
    name: "CheckboxGroup",
    covers: ["checkbox-group/onValueChange"],
    build: (spy) => {
      const f = createCheckboxGroup({ items, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue(["a"]), putBack: () => f.setValue(["c"]) };
    },
    expected: (s) => (s as { value: string[] }).value,
    after: ["a"],
    settled: ["c"],
  },
  {
    name: "Checkbox",
    covers: ["checkbox/onCheckedChange"],
    build: (spy) => {
      const f = createCheckbox({ onCheckedChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setChecked(true), putBack: () => f.setChecked(false) };
    },
    expected: (s) => (s as { checked: unknown }).checked,
    after: true,
    settled: false,
  },
  {
    name: "Collapsible",
    covers: ["collapsible/onOpenChange"],
    build: (spy) => {
      const f = createCollapsible({ onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true), putBack: () => f.setOpen(false) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
    settled: false,
  },
  {
    name: "Combobox value",
    covers: ["combobox/onValueChange"],
    build: (spy) => {
      const f = createCombobox({ items: labelled, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("b"), putBack: () => f.setValue("a") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "b",
    settled: "a",
  },
  {
    name: "Combobox open",
    covers: ["combobox/onOpenChange"],
    build: (spy) => {
      const f = createCombobox({ items: labelled, onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true), putBack: () => f.setOpen(false) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
    settled: false,
  },
  {
    name: "Combobox input",
    covers: ["combobox/onInputValueChange"],
    build: (spy) => {
      const f = createCombobox({ items: labelled, onInputValueChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => typed((node) => f.inputAction(node), "A"),
        putBack: () => f.syncInputValue("B"),
      };
    },
    expected: (s) => (s as { inputValue: string }).inputValue,
    after: "A",
    settled: "B",
  },
  {
    name: "ContextMenu",
    covers: ["context-menu/onOpenChange"],
    build: (spy) => {
      const f = createContextMenu({ items: labelled, onOpenChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => get(f.api).openMenu(),
        putBack: () => get(f.api).closeMenu(),
      };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
    settled: false,
  },
  {
    name: "Dialog",
    covers: ["dialog/onOpenChange"],
    build: (spy) => {
      const f = createDialog({ onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true), putBack: () => f.setOpen(false) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
    settled: false,
  },
  {
    name: "DropdownMenu",
    covers: ["dropdown-menu/onOpenChange"],
    build: (spy) => {
      const f = createDropdownMenu({ items: labelled, onOpenChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => get(f.api).openMenu(),
        putBack: () => get(f.api).closeMenu(),
      };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
    settled: false,
  },
  {
    name: "HoverCard",
    covers: ["hover-card/onOpenChange"],
    build: (spy) => {
      const f = createHoverCard({ onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true), putBack: () => f.setOpen(false) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
    settled: false,
  },
  {
    name: "MultiSelect values",
    covers: ["multi-select/onValuesChange"],
    build: (spy) => {
      const f = createMultiSelect({ items: labelled, onValuesChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValues(["a"]), putBack: () => f.setValues(["b"]) };
    },
    expected: (s) => (s as { values: string[] }).values,
    after: ["a"],
    settled: ["b"],
  },
  {
    name: "MultiSelect open",
    covers: ["multi-select/onOpenChange"],
    build: (spy) => {
      const f = createMultiSelect({ items: labelled, onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true), putBack: () => f.setOpen(false) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
    settled: false,
  },
  {
    name: "MultiSelect input",
    covers: ["multi-select/onInputValueChange"],
    build: (spy) => {
      const f = createMultiSelect({ items: labelled, onInputValueChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => typed((node) => f.inputAction(node), "A"),
        putBack: () => f.syncInputValue("B"),
      };
    },
    expected: (s) => (s as { inputValue: string }).inputValue,
    after: "A",
    settled: "B",
  },
  {
    name: "NavigationMenu",
    covers: ["navigation-menu/onValueChange"],
    build: (spy) => {
      const f = createNavigationMenu({ onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("docs"), putBack: () => f.setValue("api") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "docs",
    settled: "api",
  },
  {
    name: "NumberField value",
    covers: ["number-field/onValueChange"],
    build: (spy) => {
      const f = createNumberField({ value: 1, onValueChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => get(f.api).setDraft("5"),
        putBack: () => f.syncValue(9),
      };
    },
    expected: (s) => (s as { value: number | null }).value,
    after: 5,
    settled: 9,
  },
  {
    name: "NumberField commit",
    covers: ["number-field/onValueCommit"],
    build: (spy) => {
      const f = createNumberField({ value: 1, onValueCommit: () => spy(f.state) });
      return {
        state: f.state,
        act: () => {
          get(f.api).setDraft("5");
          get(f.api).commit();
        },
      };
    },
    expected: (s) => (s as { committedValue: number | null }).committedValue,
    after: 5,
  },
  {
    name: "Pagination",
    covers: ["pagination/onPageChange"],
    build: (spy) => {
      const f = createPagination({ page: 1, pageCount: 3, onPageChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setPage(2), putBack: () => f.setPage(3) };
    },
    expected: (s) => (s as { page: number }).page,
    after: 2,
    settled: 3,
  },
  {
    name: "PinInput complete",
    covers: ["pin-input/onComplete"],
    build: (spy) => {
      const f = createPinInput({ length: 2, onComplete: () => spy(f.state) });
      return { state: f.state, act: () => f.setValues(["1", "2"]) };
    },
    expected: (s) => (s as { values: string[] }).values,
    after: ["1", "2"],
  },
  {
    name: "PinInput value",
    covers: ["pin-input/onValueChange"],
    build: (spy) => {
      const f = createPinInput({ length: 2, onValueChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => f.setValues(["1", ""]),
        putBack: () => f.setValues(["2", ""]),
      };
    },
    expected: (s) => (s as { values: string[] }).values,
    after: ["1", ""],
    settled: ["2", ""],
  },
  {
    name: "Popover",
    covers: ["popover/onOpenChange"],
    build: (spy) => {
      const f = createPopover({ onOpenChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setOpen(true), putBack: () => f.setOpen(false) };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
    settled: false,
  },
  {
    name: "RadioGroup",
    covers: ["radio-group/onValueChange"],
    build: (spy) => {
      const f = createRadioGroup({ items, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("b"), putBack: () => f.setValue("c") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "b",
    settled: "c",
  },
  {
    name: "RangeSlider",
    covers: ["range-slider/onValueChange"],
    build: (spy) => {
      const f = createRangeSlider({ value: [20, 80], onValueChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => f.setValue(0, 30),
        putBack: () => f.syncValue([10, 80]),
      };
    },
    expected: (s) => (s as { value: readonly [number, number] }).value,
    after: [30, 80],
    settled: [10, 80],
  },
  {
    // Its value is the radio group's, read back as a number.
    name: "RatingGroup",
    covers: ["rating-group/onValueChange"],
    build: (spy) => {
      const f = createRatingGroup({ max: 5, onValueChange: () => spy(f.value) });
      return { state: f.value, act: () => f.setValue(3), putBack: () => f.setValue(5) };
    },
    expected: (s) => s,
    after: 3,
    settled: 5,
  },
  {
    name: "Select value",
    covers: ["select/onValueChange"],
    build: (spy) => {
      const f = createSelect({ items: labelled, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("b"), putBack: () => f.setValue("a") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "b",
    settled: "a",
  },
  {
    name: "Select open",
    covers: ["select/onOpenChange"],
    build: (spy) => {
      const f = createSelect({ items: labelled, onOpenChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => get(f.api).openListbox(),
        putBack: () => get(f.api).closeListbox(),
      };
    },
    expected: (s) => (s as { open: boolean }).open,
    after: true,
    settled: false,
  },
  {
    name: "Slider",
    covers: ["slider/onValueChange"],
    build: (spy) => {
      const f = createSlider({ value: 10, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue(20), putBack: () => f.setValue(30) };
    },
    expected: (s) => (s as { value: number }).value,
    after: 20,
    settled: 30,
  },
  {
    name: "Stepper",
    covers: ["stepper/onStepChange"],
    build: (spy) => {
      // Linear by default: only the next step is reachable.
      const f = createStepper({ count: 3, onStepChange: () => spy(f.state) });
      return { state: f.state, act: () => f.next(), putBack: () => f.goTo(0) };
    },
    expected: (s) => (s as { current: number }).current,
    after: 1,
    settled: 0,
  },
  {
    name: "Switch",
    covers: ["switch/onCheckedChange"],
    build: (spy) => {
      const f = createSwitch({ onCheckedChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setChecked(true), putBack: () => f.setChecked(false) };
    },
    expected: (s) => (s as { checked: boolean }).checked,
    after: true,
    settled: false,
  },
  {
    name: "Table sort",
    covers: ["table/onSortChange"],
    build: (spy) => {
      const f = createTable({
        columns: [{ key: "name", sortable: true }],
        onSortChange: () => spy(f.state),
      });
      return {
        state: f.state,
        act: () => f.setSort({ key: "name", direction: "asc" }),
        putBack: () => f.setSort(null),
      };
    },
    expected: (s) => (s as { sort: unknown }).sort,
    after: { key: "name", direction: "asc" },
    settled: null,
  },
  {
    name: "Table hidden columns",
    covers: ["table/onHiddenColumnsChange"],
    build: (spy) => {
      const f = createTable({
        columns: [{ key: "name" }, { key: "role" }],
        onHiddenColumnsChange: () => spy(f.state),
      });
      return {
        state: f.state,
        act: () => get(f.api).toggleColumnVisibility("role"),
        putBack: () => f.syncHiddenColumns([]),
      };
    },
    expected: (s) => (s as { hiddenColumns: string[] }).hiddenColumns,
    after: ["role"],
    settled: [],
  },
  {
    name: "Table selected rows",
    covers: ["table/onSelectedRowIdsChange"],
    build: (spy) => {
      const f = createTable({
        columns: [{ key: "name" }],
        selectionMode: "multiple",
        onSelectedRowIdsChange: () => spy(f.state),
      });
      return {
        state: f.state,
        act: () => get(f.api).toggleRowSelection("r1"),
        putBack: () => f.syncSelectedRowIds([]),
      };
    },
    expected: (s) => (s as { selectedRowIds: string[] }).selectedRowIds,
    after: ["r1"],
    settled: [],
  },
  {
    name: "Tabs",
    covers: ["tabs/onValueChange"],
    build: (spy) => {
      const f = createTabs({ items, onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("b"), putBack: () => f.setValue("c") };
    },
    expected: (s) => (s as { value: string | null }).value,
    after: "b",
    settled: "c",
  },
  {
    name: "TextField",
    covers: ["text-field/onValueChange"],
    build: (spy) => {
      const f = createTextField({ onValueChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setValue("Ada"), putBack: () => f.setValue("Grace") };
    },
    expected: (s) => (s as { value: string }).value,
    after: "Ada",
    settled: "Grace",
  },
  {
    name: "TimeField value",
    covers: ["time-field/onValueChange"],
    build: (spy) => {
      const f = createTimeField({ value: "10:30", onValueChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => get(f.api).getSegmentProps("hour").onKeyDown?.(arrowUp()),
        putBack: () => f.syncValue("07:15"),
      };
    },
    expected: (s) => (s as { parts: { hour: number | null } }).parts.hour,
    after: 11,
    settled: 7,
  },
  {
    name: "ToggleButton",
    covers: ["toggle-button/onPressedChange"],
    build: (spy) => {
      const f = createToggleButton({ onPressedChange: () => spy(f.state) });
      return { state: f.state, act: () => f.setPressed(true), putBack: () => f.setPressed(false) };
    },
    expected: (s) => (s as { pressed: boolean }).pressed,
    after: true,
    settled: false,
  },
  {
    name: "TreeView expanded",
    covers: ["tree-view/onExpandedChange"],
    build: (spy) => {
      const f = createTreeView({
        nodes: [{ value: "a", children: [{ value: "a1" }] }],
        onExpandedChange: () => spy(f.state),
      });
      return {
        state: f.state,
        act: () => get(f.api).toggle("a"),
        putBack: () => f.syncExpanded([]),
      };
    },
    expected: (s) => (s as { expanded: string[] }).expanded,
    after: ["a"],
    settled: [],
  },
  {
    name: "TreeView selected",
    covers: ["tree-view/onSelectedChange"],
    build: (spy) => {
      const f = createTreeView({ nodes: [{ value: "a" }], onSelectedChange: () => spy(f.state) });
      return {
        state: f.state,
        act: () => get(f.api).select("a"),
        putBack: () => f.syncSelected(null),
      };
    },
    expected: (s) => (s as { selected: string | null }).selected,
    after: "a",
    settled: null,
  },
];

/** A key press on a segment, with the bits the handler reads. */
const arrowUp = () =>
  ({
    key: "ArrowUp",
    preventDefault: () => {},
    stopPropagation: () => {},
  }) as unknown as KeyboardEvent;

// The tooltip opens from its trigger's events after a delay, so it runs the
// clock instead of calling a setter.
const TOOLTIP_COVERS = ["tooltip/onOpenChange"];

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

  it.runIf(row.settled !== undefined)("keeps a write made from inside the handler", () => {
    let built: Built | null = null;
    let wrote = false;
    built = row.build(() => {
      if (wrote) return;
      wrote = true;
      built?.putBack?.();
    });
    built.act();
    expect(wrote, "the callback never ran, so nothing was written back").toBe(true);
    expect(row.expected(get(built.state))).toEqual(row.settled);
  });
});

// One action, two reports: the second has to agree with what the first left
// behind. A consumer that clears the field from its own change handler has
// made the pin incomplete, so there is no completion to announce.
describe("PinInput reports a completion only for the value still committed", () => {
  it("says nothing about a value the handler has already replaced", () => {
    const seen: string[] = [];
    const f = createPinInput({
      length: 3,
      onValueChange: (value) => {
        seen.push(`change:${value}`);
        if (value === "123") f.setValues(["", "", ""]);
      },
      onComplete: (value) => seen.push(`complete:${value}`),
    });

    f.setValues(["1", "2", "3"]);

    expect(seen).toEqual(["change:123", "change:"]);
    expect(get(f.state).values).toEqual(["", "", ""]);
  });

  it("announces the completion the handler leaves alone", () => {
    const seen: string[] = [];
    const f = createPinInput({
      length: 3,
      onValueChange: (value) => seen.push(`change:${value}`),
      onComplete: (value) => seen.push(`complete:${value}`),
    });

    f.setValues(["1", "2", "3"]);

    expect(seen).toEqual(["change:123", "complete:123"]);
  });
});

// Callbacks a factory reports without owning a value to commit: the report is
// the whole event, so there is no committed state for a row to read.
const NOT_A_ROW: Record<string, string> = {
  "menubar/onSelect": "names the item a person chose; menubar keeps no value of its own",
  "search-dialog/onSelect": "names the result a person chose; the dialog keeps no value of it",
  "time-field/onValueCommit":
    "core decides when a commit lands; the TimeField value row covers the setter this adapter owns",
  "time-field/onValidationChange":
    "reported from setParts, the setter the TimeField value row drives, and once at construction",
};

/** Every `context.on…` a factory calls, as "<factory directory>/<callback>". */
function reportedCallbacks(): string[] {
  const lib = resolve(__dirname);
  const found = new Set<string>();
  for (const dir of readdirSync(lib, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    let source: string;
    try {
      source = readFileSync(resolve(lib, dir.name, `create-${dir.name}.ts`), "utf8");
    } catch {
      continue;
    }
    for (const [, callback] of source.matchAll(/context\.(on[A-Za-z]+)\?\.\(/g)) {
      found.add(`${dir.name}/${callback}`);
    }
  }
  return [...found].sort();
}

// The table above is only worth as much as its completeness. A setter added
// to a factory, or a factory added to the library, fails here until it is
// covered or named with the reason it cannot be.
describe("the table covers every callback the factories report", () => {
  const covered = new Set([...rows.flatMap((row) => row.covers), ...TOOLTIP_COVERS]);

  it("leaves no reported callback unasserted", () => {
    const uncovered = reportedCallbacks().filter((key) => !covered.has(key) && !(key in NOT_A_ROW));
    expect(uncovered).toEqual([]);
  });

  it("claims nothing the factories no longer report", () => {
    const reported = new Set(reportedCallbacks());
    const stale = [...covered, ...Object.keys(NOT_A_ROW)].filter((key) => !reported.has(key));
    expect(stale.sort()).toEqual([]);
  });

  it("finds the factories at all", () => {
    expect(reportedCallbacks().length).toBeGreaterThan(30);
  });
});
