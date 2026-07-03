import { combobox as core } from "@design-system/core";
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type ComboboxItem = core.ComboboxItem;
export type ComboboxApi = core.ComboboxApi;
export type ComboboxState = core.ComboboxState;

export interface ComboboxContext extends core.ComboboxContext {
  /**
   * How to filter items against the current input text. Defaults to a
   * case-insensitive substring match on the label; return all items for an empty
   * query.
   */
  filter?: (items: ComboboxItem[], query: string) => ComboboxItem[];
}

export interface CreateCombobox {
  state: Readable<ComboboxState>;
  api: Readable<ComboboxApi>;
  /** The selected value (or `null`). */
  value: Readable<string | null>;
  /** The current input text. */
  inputValue: Readable<string>;
  /** Whether the popup is open. */
  open: Readable<boolean>;
  /** The currently visible (filtered) items. */
  items: Readable<ComboboxItem[]>;
  /** Svelte action for the label: `<label use:labelAction>`. */
  labelAction: Action<HTMLElement>;
  /** Svelte action for the control wrapper (keeps chevron/clear clicks "inside"). */
  controlAction: Action<HTMLElement>;
  /** Svelte action for the input: `<input use:inputAction>`. */
  inputAction: Action<HTMLElement>;
  /** Svelte action for the listbox popup: `<ul use:listboxAction>`. */
  listboxAction: Action<HTMLElement>;
  /** Svelte action for an option: `<li use:optionAction={value}>`. */
  optionAction: Action<HTMLElement, string>;
  /** Svelte action for an optional clear button. */
  clearAction: Action<HTMLElement>;
  /** Open the listbox showing all options (even when a value is selected). */
  openAll: () => void;
  /** Imperatively select a value. */
  setValue: (value: string | null) => void;
  /** Sync an externally-controlled value without emitting a change event. */
  syncValue: (value: string | null) => void;
  /** Sync externally-controlled input text without emitting a change event. */
  syncInputValue: (inputValue: string) => void;
  /** Replace the option list (e.g. when items change). */
  setItems: (items: ComboboxItem[]) => void;
  /** Sync an externally-controlled disabled state. */
  setDisabled: (disabled: boolean) => void;
  /** Imperatively set the open state. */
  setOpen: (open: boolean) => void;
}

const defaultFilter = (items: ComboboxItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

/**
 * Create a headless combobox (editable input + filtered listbox). Behaviour and
 * ARIA live in `@design-system/core`; this adapter owns the DOM concerns: text
 * filtering, popup positioning (`@floating-ui/dom`, flip/shift),
 * close-on-outside-pointer, and keeping the active option scrolled into view.
 * DOM focus stays on the input (activedescendant).
 */
export function createCombobox(context: ComboboxContext): CreateCombobox {
  let allItems = context.items;
  const filter = context.filter ?? defaultFilter;

  const state = writable<ComboboxState>({
    ...core.initialState(context),
    items: filter(allItems, context.inputValue ?? ""),
  });

  const updateValue = (value: string | null, notify: boolean) =>
    state.update((current) => {
      if (current.value === value) return current;
      if (notify) context.onValueChange?.(value);
      return { ...current, value };
    });

  const setValue = (value: string | null) => updateValue(value, true);
  const syncValue = (value: string | null) => updateValue(value, false);

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

  const setItems = (items: ComboboxItem[]) => {
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

  const api = derived(state, ($state) =>
    core.connect({
      state: $state,
      setValue,
      setOpen,
      setActiveValue,
      setInputValue,
      normalize: normalizeProps,
    }),
  );

  let inputEl: HTMLElement | null = null;
  let listboxEl: HTMLElement | null = null;
  let controlEl: HTMLElement | null = null;

  // Open the listbox showing ALL options (ignore the current input text), so a
  // chosen value can be changed via the chevron without clearing it first.
  const openAll = () => {
    const wasOpen = get(state).open;
    state.update((current) => ({
      ...current,
      open: true,
      items: filter(allItems, ""),
      // No first-item pre-highlight; only the selected value (if any).
      activeValue: current.value,
    }));
    if (!wasOpen) context.onOpenChange?.(true);
    inputEl?.focus();
  };

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

  // Registers the control wrapper so clicks on the chevron/clear (inside it but
  // outside the input) don't count as an outside-press that closes the listbox.
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
          node.style.minWidth = `${inputEl.offsetWidth}px`;
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

  const clearAction = createPropsAction(api, (a) => a.clearProps);

  return {
    state,
    api,
    value: derived(state, ($s) => $s.value),
    inputValue: derived(state, ($s) => $s.inputValue),
    open: derived(state, ($s) => $s.open),
    items: derived(state, ($s) => $s.items),
    labelAction,
    controlAction,
    inputAction,
    listboxAction,
    optionAction,
    clearAction,
    openAll,
    setValue,
    syncValue,
    syncInputValue,
    setItems,
    setDisabled,
    setOpen,
  };
}
