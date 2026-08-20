import { multiSelect as core } from "@design-system/core";
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { fail } from "../internal/dev";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type MultiSelectItem = core.MultiSelectItem;
export type MultiSelectApi = core.MultiSelectApi;
export type MultiSelectState = core.MultiSelectState;

export interface MultiSelectContext extends core.MultiSelectContext {
  /**
   * How to filter items against the current input text. Defaults to a
   * case-insensitive substring match on the label; return all items for an
   * empty query.
   */
  filter?: (items: MultiSelectItem[], query: string) => MultiSelectItem[];
}

export interface CreateMultiSelect {
  state: Readable<MultiSelectState>;
  api: Readable<MultiSelectApi>;
  /** The selected values, ordered by selection. */
  values: Readable<string[]>;
  /** The current input text. */
  inputValue: Readable<string>;
  /** Whether the popup is open. */
  open: Readable<boolean>;
  /** The currently visible (filtered) items. */
  items: Readable<MultiSelectItem[]>;
  /** Svelte action for the label: `<label use:labelAction>`. */
  labelAction: Action<HTMLElement>;
  /** Svelte action for the control wrapper (keeps inner clicks "inside"). */
  controlAction: Action<HTMLElement>;
  /** Svelte action for the input: `<input use:inputAction>`. */
  inputAction: Action<HTMLElement>;
  /** Svelte action for the listbox popup: `<ul use:listboxAction>`. */
  listboxAction: Action<HTMLElement>;
  /** Svelte action for an option: `<li use:optionAction={value}>`. */
  optionAction: Action<HTMLElement, string>;
  /** Svelte action for the selected-values (tag) list container. */
  valuesListAction: Action<HTMLElement>;
  /** Imperatively set the selected values (notifies once on a real change). */
  setValues: (values: string[]) => void;
  /** Sync externally-controlled values without emitting a change event. */
  syncValues: (values: string[]) => void;
  /** Sync externally-controlled input text without emitting a change event. */
  syncInputValue: (inputValue: string) => void;
  /** Replace the option list (e.g. when items change). */
  setItems: (items: MultiSelectItem[]) => void;
  /** Sync an externally-controlled disabled state. */
  setDisabled: (disabled: boolean) => void;
  /** Sync an externally-controlled read-only state. */
  syncReadOnly: (readOnly: boolean) => void;
  /** Sync an externally-controlled max. */
  syncMax: (max: number | null) => void;
  /** Sync the externally-controlled Backspace opt-in. */
  syncRemoveOnBackspace: (removeOnBackspace: boolean) => void;
  /** Imperatively set the open state. */
  setOpen: (open: boolean) => void;
}

const defaultFilter = (items: MultiSelectItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

/**
 * The values contract keeps entries unique; a controlled value that already
 * carries duplicates is a consumer error. Development fails, production keeps
 * the value untouched (selection data is never pruned).
 */
function assertUniqueValues(values: string[]): void {
  if (new Set(values).size !== values.length) {
    fail("`values` must not contain duplicate entries.");
  }
}

/**
 * Create a headless multi select (editable input + multiselectable filtered
 * listbox + removable selected values). Behaviour and ARIA live in
 * `@design-system/core`; this adapter owns the DOM concerns: text filtering,
 * popup positioning (`@floating-ui/dom`, flip/shift), close-on-outside-pointer
 * and keeping the active option scrolled into view. DOM focus stays on the
 * input (activedescendant).
 */
export function createMultiSelect(context: MultiSelectContext): CreateMultiSelect {
  let allItems = context.items;
  const filter = context.filter ?? defaultFilter;
  if (context.values) assertUniqueValues(context.values);

  const state = writable<MultiSelectState>({
    ...core.initialState({ ...context, id: context.id ?? stableId("ds-multi-select") }),
    items: filter(allItems, context.inputValue ?? ""),
  });

  const valuesEqual = (a: string[], b: string[]) =>
    a === b || (a.length === b.length && a.every((value, index) => value === b[index]));

  const updateValues = (values: string[], notify: boolean) =>
    state.update((current) => {
      if (valuesEqual(current.values, values)) return current;
      if (notify) context.onValuesChange?.(values);
      return { ...current, values };
    });

  const setValues = (values: string[]) => updateValues(values, true);
  const syncValues = (values: string[]) => {
    assertUniqueValues(values);
    updateValues(values, false);
  };

  const setOpen = (open: boolean) =>
    state.update((current) => {
      if (current.open === open) return current;
      context.onOpenChange?.(open);
      return { ...current, open };
    });

  const setActiveValue = (activeValue: string | null) =>
    state.update((current) =>
      current.activeValue === activeValue ? current : { ...current, activeValue },
    );

  const setInputValue = (inputValue: string) =>
    state.update((current) => {
      if (current.inputValue === inputValue) return current;
      context.onInputValueChange?.(inputValue);
      return { ...current, inputValue, items: filter(allItems, inputValue) };
    });

  const syncInputValue = (inputValue: string) =>
    state.update((current) =>
      current.inputValue === inputValue
        ? current
        : { ...current, inputValue, items: filter(allItems, inputValue) },
    );

  const setItems = (items: MultiSelectItem[]) => {
    allItems = items;
    state.update((current) => ({
      ...current,
      items: filter(allItems, current.inputValue),
      activeValue:
        current.activeValue && items.some((item) => item.value === current.activeValue)
          ? current.activeValue
          : null,
    }));
  };

  const setDisabled = (disabled: boolean) =>
    state.update((current) => (current.disabled === disabled ? current : { ...current, disabled }));

  const syncReadOnly = (readOnly: boolean) =>
    state.update((current) => (current.readOnly === readOnly ? current : { ...current, readOnly }));

  const syncMax = (max: number | null) =>
    state.update((current) => (current.max === max ? current : { ...current, max }));

  const syncRemoveOnBackspace = (removeOnBackspace: boolean) =>
    state.update((current) =>
      current.removeOnBackspace === removeOnBackspace ? current : { ...current, removeOnBackspace },
    );

  const api = derived(state, ($state) =>
    core.connect({
      state: $state,
      setValues,
      setOpen,
      setActiveValue,
      setInputValue,
      normalize: normalizeProps,
    }),
  );

  let inputEl: HTMLElement | null = null;
  let listboxEl: HTMLElement | null = null;
  let controlEl: HTMLElement | null = null;

  const placement: Placement = "bottom-start";
  const reposition = () => {
    if (!inputEl || !listboxEl) return;
    computePosition(inputEl, listboxEl, {
      placement,
      strategy: "fixed",
      middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      if (!listboxEl) return;
      listboxEl.style.left = `${x}px`;
      listboxEl.style.top = `${y}px`;
    });
  };

  const onOutsidePointer = (event: Event) => {
    const target = event.target as Node;
    if (controlEl?.contains(target) || inputEl?.contains(target) || listboxEl?.contains(target))
      return;
    setOpen(false);
    setActiveValue(null);
  };

  const labelAction = createPropsAction(api, (a) => a.labelProps);

  const controlAction: Action<HTMLElement> = (node) => {
    controlEl = node;
    return {
      destroy() {
        if (controlEl === node) controlEl = null;
      },
    };
  };

  const inputAction: Action<HTMLElement> = (node) => {
    inputEl = node;
    const base = createPropsAction(api, (a) => a.inputProps)(node);

    // Typing filters and opens; the first match becomes active.
    const onInput = (event: Event) => {
      const text = (event.target as HTMLInputElement).value;
      setInputValue(text);
      const current = get(state);
      setActiveValue(core.firstEnabled(current.items));
      if (!current.open) setOpen(true);
    };
    // Clicking the (closed) input opens the list.
    const onPointerDown = () => {
      if (!get(state).open) get(api).openListbox();
    };
    node.addEventListener("input", onInput);
    node.addEventListener("pointerdown", onPointerDown);

    return {
      destroy() {
        node.removeEventListener("input", onInput);
        node.removeEventListener("pointerdown", onPointerDown);
        if (inputEl === node) inputEl = null;
        base?.destroy?.();
      },
    };
  };

  const listboxAction: Action<HTMLElement> = (node) => {
    listboxEl = node;
    const base = createPropsAction(api, (a) => a.listboxProps)(node);

    let stopAutoUpdate: (() => void) | null = null;
    const teardown = () => {
      stopAutoUpdate?.();
      stopAutoUpdate = null;
      document.removeEventListener("pointerdown", onOutsidePointer, true);
    };

    const unsubscribe = state.subscribe(($state) => {
      if ($state.open) {
        if (!stopAutoUpdate && inputEl) {
          node.style.minWidth = `${controlEl?.offsetWidth ?? inputEl.offsetWidth}px`;
          stopAutoUpdate =
            typeof ResizeObserver !== "undefined"
              ? autoUpdate(inputEl, node, reposition)
              : (reposition(), () => {});
          document.addEventListener("pointerdown", onOutsidePointer, true);
        }
        requestAnimationFrame(() => {
          node.querySelector<HTMLElement>("[data-active]")?.scrollIntoView?.({ block: "nearest" });
        });
      } else {
        teardown();
      }
    });

    return {
      destroy() {
        unsubscribe();
        teardown();
        if (listboxEl === node) listboxEl = null;
        base?.destroy?.();
      },
    };
  };

  const optionAction: Action<HTMLElement, string> = (node, value) => {
    const optionApi = derived(api, (a) => a.getOptionProps(value));
    const handle = createPropsAction(optionApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  const valuesListAction = createPropsAction(api, (a) => a.valuesListProps);

  return {
    state,
    api,
    values: derived(state, ($s) => $s.values),
    inputValue: derived(state, ($s) => $s.inputValue),
    open: derived(state, ($s) => $s.open),
    items: derived(state, ($s) => $s.items),
    labelAction,
    controlAction,
    inputAction,
    listboxAction,
    optionAction,
    valuesListAction,
    setValues,
    syncValues,
    syncInputValue,
    setItems,
    setDisabled,
    syncReadOnly,
    syncMax,
    syncRemoveOnBackspace,
    setOpen,
  };
}
