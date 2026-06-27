import { combobox as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createDialog } from "../dialog/create-dialog";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type CommandItem = core.ComboboxItem;

export interface CommandContext {
  /** The available commands. */
  items: CommandItem[];
  /** Initial open state. */
  open?: boolean;
  /** Filter commands against the query. Defaults to case-insensitive substring. */
  filter?: (items: CommandItem[], query: string) => CommandItem[];
  /** Called when a command is chosen (before the palette closes). */
  onCommand?: (value: string) => void;
  /** Called whenever the palette opens/closes. */
  onOpenChange?: (open: boolean) => void;
}

export interface CreateCommand {
  /** Whether the palette is open. */
  open: Readable<boolean>;
  /** Imperatively open/close the palette. */
  setOpen: (open: boolean) => void;
  /** The currently visible (filtered) commands. */
  items: Readable<CommandItem[]>;
  /** The current query text. */
  inputValue: Readable<string>;
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

const defaultFilter = (items: CommandItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

/**
 * Create a headless command palette — a combobox inside a modal dialog. The
 * modal shell (portal, focus trap, scroll lock, Escape / backdrop close, focus
 * restore) comes from {@link createDialog}; the search input + filtered results
 * reuse the headless combobox (`@design-system/core`) wired "always open" while
 * the dialog is open. Choosing a command runs `onCommand` and closes. The list
 * is rendered inline in the dialog (no floating popup).
 */
export function createCommand(context: CommandContext): CreateCommand {
  const allItems = context.items;
  const filter = context.filter ?? defaultFilter;
  const base = core.initialState({ items: allItems });

  const dialog = createDialog({
    open: context.open,
    onOpenChange: context.onOpenChange,
    // The palette opens with the search input focused, ready to type.
    initialFocus: ".command__input",
  });

  const query = writable({
    inputValue: "",
    // Nothing pre-highlighted on open; the first match is highlighted once the
    // user starts typing (so Enter runs the top result).
    activeValue: null as string | null,
    items: allItems,
  });

  // Reset the query each time the palette opens.
  dialog.open.subscribe((isOpen) => {
    if (isOpen) {
      query.set({ inputValue: "", activeValue: null, items: allItems });
    }
  });

  const setActiveValue = (activeValue: string | null) =>
    query.update((q) => ({ ...q, activeValue }));
  const setInputValue = (inputValue: string) =>
    query.update((q) => ({ ...q, inputValue, items: filter(allItems, inputValue) }));

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
        if (v != null) context.onCommand?.(v);
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
    triggerAction: dialog.triggerAction,
    contentAction: dialog.contentAction,
    titleAction: dialog.titleAction,
    labelAction: createPropsAction(api, (a) => a.labelProps),
    inputAction,
    listboxAction: createPropsAction(api, (a) => a.listboxProps),
    optionAction,
  };
}
