import { combobox as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createDialog } from "../dialog/create-dialog";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export interface SearchDialogItem extends core.ComboboxItem {
  /**
   * Optional section the result belongs to ("Pages", "Actions"). Grouped
   * results render under a section header; ungrouped results come first.
   */
  group?: string;
  /**
   * Keyboard-shortcut hint shown right-aligned on the result ("⌘S", or
   * ["⌘", "S"] for a chord). A label, not a binding: the dialog never
   * registers shortcuts — live shortcuts belong to the application.
   */
  shortcut?: string | string[];
}

export interface SearchDialogContext {
  /** The searchable results. */
  items: SearchDialogItem[];
  /**
   * Items shown while the query is empty (recents, frequent searches — the
   * application measures, the dialog displays). They may carry their own
   * `group` ("Recent"). When omitted or empty, an empty query shows all items.
   */
  suggestions?: SearchDialogItem[];
  /** Initial open state. */
  open?: boolean;
  /** Filter results against the query. Defaults to case-insensitive substring. */
  filter?: (items: SearchDialogItem[], query: string) => SearchDialogItem[];
  /** Called when a result is chosen (before the dialog closes). */
  onSelect?: (value: string) => void;
  /** Called whenever the dialog opens/closes. */
  onOpenChange?: (open: boolean) => void;
}

export interface CreateSearchDialog {
  /** Whether the palette is open. */
  open: Readable<boolean>;
  /** Imperatively open/close the palette. */
  setOpen: (open: boolean) => void;
  /** The currently visible (filtered) commands. */
  items: Readable<SearchDialogItem[]>;
  /** The current query text. */
  inputValue: Readable<string>;
  /** Replace the result list (e.g. when results load asynchronously). */
  setItems: (items: SearchDialogItem[]) => void;
  /** Replace the empty-query suggestions. */
  setSuggestions: (suggestions: SearchDialogItem[]) => void;
  /** Action for the trigger button. */
  triggerAction: Action<HTMLElement>;
  /** Action for the dialog panel (render only while open). */
  contentAction: Action<HTMLElement>;
  /** Action for the dialog title (names the modal). */
  titleAction: Action<HTMLElement>;
  /** Action for the (combobox) search label. */
  labelAction: Action<HTMLElement>;
  /** Action for the search input. */
  inputAction: Action<HTMLElement>;
  /** Action for the results listbox. */
  listboxAction: Action<HTMLElement>;
  /** Action for a result option: `use:optionAction={value}`. */
  optionAction: Action<HTMLElement, string>;
}

const defaultFilter = (items: SearchDialogItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

/**
 * Put items in display order: ungrouped results first (in the given order),
 * then one run per group, groups ordered by first appearance. Keyboard
 * navigation follows the item order, so the logical order must match what the
 * grouped list renders.
 */
const orderItems = (items: SearchDialogItem[]): SearchDialogItem[] => {
  const ungrouped: SearchDialogItem[] = [];
  const groups = new Map<string, SearchDialogItem[]>();
  for (const item of items) {
    if (!item.group) ungrouped.push(item);
    else {
      const run = groups.get(item.group) ?? [];
      run.push(item);
      groups.set(item.group, run);
    }
  }
  return [...ungrouped, ...[...groups.values()].flat()];
};

/**
 * Create a headless quick search — a combobox inside a modal dialog. The
 * modal shell (native `<dialog>` + `showModal()`, scroll lock, Escape /
 * backdrop close, focus restore) comes from {@link createDialog}; the search input + filtered results
 * reuse the headless combobox (`@design-system/core`) wired "always open" while
 * the dialog is open. Choosing a command runs `onSelect` and closes. The list
 * is rendered inline in the dialog (no floating popup).
 */
export function createSearchDialog(context: SearchDialogContext): CreateSearchDialog {
  let allItems = orderItems(context.items);
  let allSuggestions = orderItems(context.suggestions ?? []);
  const filter = context.filter ?? defaultFilter;

  // Empty query: show the suggestions when provided, everything otherwise.
  const visibleFor = (query: string) =>
    query.trim() === "" && allSuggestions.length ? allSuggestions : filter(allItems, query);
  const base = core.initialState({ items: allItems });

  const dialog = createDialog({
    open: context.open,
    onOpenChange: context.onOpenChange,
    // The palette opens with the search input focused, ready to type.
    initialFocus: ".search-dialog__input",
  });

  const query = writable({
    inputValue: "",
    // Nothing pre-highlighted on open; the first match is highlighted once the
    // user starts typing (so Enter runs the top result).
    activeValue: null as string | null,
    items: visibleFor(""),
  });

  // Reset the query each time the palette opens.
  dialog.open.subscribe((isOpen) => {
    if (isOpen) {
      query.set({ inputValue: "", activeValue: null, items: visibleFor("") });
    }
  });

  const setActiveValue = (activeValue: string | null) =>
    query.update((q) => ({ ...q, activeValue }));
  const setInputValue = (inputValue: string) =>
    query.update((q) => ({ ...q, inputValue, items: visibleFor(inputValue) }));

  const refresh = () =>
    query.update((q) => {
      const items = visibleFor(q.inputValue);
      return {
        ...q,
        items,
        activeValue:
          q.activeValue && items.some((item) => item.value === q.activeValue)
            ? q.activeValue
            : null,
      };
    });

  const setItems = (items: SearchDialogItem[]) => {
    allItems = orderItems(items);
    refresh();
  };

  const setSuggestions = (suggestions: SearchDialogItem[]) => {
    allSuggestions = orderItems(suggestions);
    refresh();
  };

  const comboState = derived([dialog.open, query], ([$open, $q]) => ({
    open: $open,
    value: null,
    inputValue: $q.inputValue,
    activeValue: $q.activeValue,
    items: $q.items,
    disabled: false,
    id: base.id,
  }));

  const api = derived(comboState, ($state) =>
    core.connect({
      state: $state,
      // Selecting a command runs it; there is no persistent selection.
      setValue: (v) => {
        if (v != null) context.onSelect?.(v);
      },
      // The combobox "closing" (Escape / select) closes the dialog.
      setOpen: (o) => {
        if (!o) dialog.setOpen(false);
      },
      setActiveValue,
      setInputValue,
      normalize: normalizeProps,
    }),
  );

  const inputAction: Action<HTMLElement> = (node) => {
    const apiBase = createPropsAction(api, (a) => a.inputProps)(node);
    const onInput = (event: Event) => {
      const text = (event.target as HTMLInputElement).value;
      setInputValue(text);
      setActiveValue(core.firstEnabled(get(query).items));
    };
    node.addEventListener("input", onInput);
    return {
      destroy() {
        node.removeEventListener("input", onInput);
        apiBase?.destroy?.();
      },
    };
  };

  const optionAction: Action<HTMLElement, string> = (node, value) => {
    const optionApi = derived(api, (a) => a.getOptionProps(value));
    const handle = createPropsAction(optionApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    open: dialog.open,
    setOpen: dialog.setOpen,
    items: derived(query, ($q) => $q.items),
    inputValue: derived(query, ($q) => $q.inputValue),
    setItems,
    setSuggestions,
    triggerAction: dialog.triggerAction,
    contentAction: dialog.contentAction,
    titleAction: dialog.titleAction,
    labelAction: createPropsAction(api, (a) => a.labelProps),
    inputAction,
    listboxAction: createPropsAction(api, (a) => a.listboxProps),
    optionAction,
  };
}
