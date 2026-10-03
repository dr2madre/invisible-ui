import { combobox as core } from "@design-system/core";
import { useId, useMemo, useState, type ChangeEvent } from "react";
import { useDialog, type UseDialog } from "../dialog/use-dialog";
import type { DialogNotices } from "../dialog/use-dialog-notices";
import { useOpening } from "../internal/opening";
import { normalizeProps } from "../normalize";

export interface SearchDialogItem extends core.ComboboxItem {
  /**
   * Optional section the result belongs to ("Pages", "Actions"). Grouped
   * results render under a section header; ungrouped results come first.
   */
  group?: string;
  /**
   * Keyboard-shortcut hint shown right-aligned on the result ("⌘S", or
   * ["⌘", "S"] for a chord). A label, not a binding: the dialog leaves live
   * shortcuts to the application.
   */
  shortcut?: string | string[];
}

export interface UseSearchDialogOptions {
  /** The searchable results. */
  items: SearchDialogItem[];
  /**
   * Items shown while the query is empty (recents, frequent searches: the
   * application measures, the dialog displays). They may carry their own
   * `group` ("Recent"). When omitted or empty, an empty query shows all items.
   */
  suggestions?: SearchDialogItem[];
  /** Initial / controlled open state. */
  open?: boolean;
  /** Filter results against the query. Defaults to case-insensitive substring. */
  filter?: (items: SearchDialogItem[], query: string) => SearchDialogItem[];
  /** Called when a result is chosen (before the dialog closes). */
  onSelect?: (value: string) => void;
  /** Called whenever the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void;
}

/** The status area comes from `useDialog` (ADR 0016). */
export interface UseSearchDialog extends DialogNotices {
  /** The connected combobox API: label, input, listbox and option prop bags. */
  api: core.ComboboxApi;
  /** The connected dialog API: trigger, panel, title and close prop bags. */
  dialogApi: UseDialog["api"];
  /** Whether the palette is open. */
  open: boolean;
  /** Open or close the palette. */
  setOpen: (open: boolean) => void;
  /** The currently visible (filtered) results, in display order. */
  items: SearchDialogItem[];
  /** The current query text. */
  inputValue: string;
  /** Typing filters the results and highlights the first match. */
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Attach to the trigger; used to restore focus on close. */
  triggerRef: UseDialog["triggerRef"];
  /** Attach to the `<dialog>` panel. Render it only while `open`. */
  panelRef: UseDialog["panelRef"];
}

const NONE: SearchDialogItem[] = [];

const defaultFilter = (items: SearchDialogItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => core.labelOf(item).toLowerCase().includes(q));
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

/** Empty query: the suggestions when there are any, the filtered items otherwise. */
const resultsFor = (
  items: SearchDialogItem[],
  suggestions: SearchDialogItem[],
  filter: (items: SearchDialogItem[], query: string) => SearchDialogItem[],
  query: string,
) => (query.trim() === "" && suggestions.length ? suggestions : filter(items, query));

/**
 * Connect a headless quick search to React: a combobox inside a modal dialog.
 * The modal shell (native `<dialog>` + `showModal()`, scroll lock, Escape and
 * backdrop close, focus restore, the status area) comes from `useDialog`; the
 * search input and filtered results reuse the headless combobox
 * (`@design-system/core`), wired "always open" while the dialog is open.
 * Choosing a result runs `onSelect` and closes. The list renders inline in
 * the dialog, so there is no popup to position.
 */
export function useSearchDialog({
  items,
  suggestions = NONE,
  open,
  filter = defaultFilter,
  onSelect,
  onOpenChange,
}: UseSearchDialogOptions): UseSearchDialog {
  const id = `ds-search-dialog-${useId()}`;
  const dialog = useDialog({
    open,
    onOpenChange,
    // The palette opens with the search input focused, ready to type.
    initialFocus: ".search-dialog__input",
  });
  const { open: isOpen, setOpen } = dialog;

  const [inputValue, setInputValue] = useState("");
  // Nothing pre-highlighted on open; typing highlights the first match, so
  // Enter runs the top result.
  const [activeValue, setActiveValue] = useState<string | null>(null);

  // Each opening starts from a blank query.
  const opening = useOpening(isOpen);
  if (opening) {
    setInputValue("");
    setActiveValue(null);
  }

  const allItems = useMemo(() => orderItems(items), [items]);
  const allSuggestions = useMemo(() => orderItems(suggestions), [suggestions]);

  const visible = useMemo(
    () => resultsFor(allItems, allSuggestions, filter, inputValue),
    [allItems, allSuggestions, filter, inputValue],
  );

  // A highlight the latest filter or item list dropped can no longer be
  // chosen, so it goes with it.
  const active =
    activeValue !== null && visible.some((item) => item.value === activeValue) ? activeValue : null;

  const api = core.connect({
    state: {
      open: isOpen,
      value: null,
      inputValue,
      // There is no selection here, so there is no text to come back to. The
      // query survives because of `settleOnBlur: false` below.
      committedInputValue: "",
      activeValue: active,
      items: visible,
      disabled: false,
      id,
    },
    // Selecting a result runs it; there is no persistent selection.
    setValue: (value) => {
      if (value != null) onSelect?.(value);
    },
    // The combobox "closing" (Escape, select) closes the dialog.
    setOpen: (next) => {
      if (!next) setOpen(false);
    },
    setActiveValue,
    setInputValue,
    setCommittedInputValue: () => {},
    // A search dialog keeps what was typed and keeps showing it: losing focus
    // must neither wipe the query nor dismiss the palette, which the dialog
    // itself owns.
    settleOnBlur: false,
    normalize: normalizeProps,
  });

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setInputValue(text);
    setActiveValue(core.firstEnabled(resultsFor(allItems, allSuggestions, filter, text)));
  };

  return {
    api,
    dialogApi: dialog.api,
    open: isOpen,
    setOpen,
    items: visible,
    inputValue,
    onInputChange,
    triggerRef: dialog.triggerRef,
    panelRef: dialog.panelRef,
    notices: dialog.notices,
    announcement: dialog.announcement,
    notify: dialog.notify,
    dismissNotice: dialog.dismissNotice,
    clearNotices: dialog.clearNotices,
  };
}
