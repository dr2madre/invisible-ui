import { combobox as core } from "@design-system/core";
import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { useDialog, type UseDialog } from "../dialog/use-dialog";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

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

export interface UseSearchDialog {
  /** The connected combobox API: prop bags plus imperative helpers. */
  api: ComputedRef<core.ComboboxApi>;
  /** The connected dialog API: trigger, panel and title prop bags. */
  dialogApi: UseDialog["api"];
  /** Whether the palette is open. */
  open: ComputedRef<boolean>;
  /** Imperatively open or close the palette. */
  setOpen: (open: boolean) => void;
  /** The currently visible (filtered) results, in display order. */
  items: ComputedRef<SearchDialogItem[]>;
  /** The current query text. */
  inputValue: Ref<string>;
  /** Typing filters the results and highlights the first match. */
  onInputChange: (event: Event) => void;
  /** Template ref for the trigger; used to restore focus on close. */
  triggerRef: UseDialog["triggerRef"];
  /** Template ref for the `<dialog>` panel. Render it only while open. */
  panelRef: UseDialog["panelRef"];
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

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * Connect a headless quick search to Vue: a combobox inside a modal dialog. The
 * modal shell (native `<dialog>` plus `showModal()`, scroll lock, Escape and
 * backdrop close, focus restore) comes from {@link useDialog}; the search input
 * and filtered results reuse the headless combobox (`@design-system/core`)
 * wired "always open" while the dialog is open. Choosing a result runs
 * `onSelect` and closes. The list renders inline in the dialog (no floating
 * popup), so there is no positioning to do.
 */
export function useSearchDialog(
  options: MaybeRefOrGetter<UseSearchDialogOptions>,
): UseSearchDialog {
  const id = useStableId("ds-search-dialog");
  const resolved = computed(() => toValue(options));

  const dialog = useDialog(() => ({
    open: resolved.value.open,
    onOpenChange: resolved.value.onOpenChange,
    // The palette opens with the search input focused, ready to type.
    initialFocus: ".search-dialog__input",
  }));

  const allItems = computed(() => orderItems(resolved.value.items));
  const allSuggestions = computed(() => orderItems(resolved.value.suggestions ?? []));

  const inputValue = ref("");
  // Nothing pre-highlighted on open; the first match is highlighted once the
  // user starts typing (so Enter runs the top result).
  const activeValue = ref<string | null>(null);

  // Empty query: show the suggestions when provided, everything otherwise.
  const visible = computed(() => {
    const query = inputValue.value;
    const filter = resolved.value.filter ?? defaultFilter;
    return query.trim() === "" && allSuggestions.value.length
      ? allSuggestions.value
      : filter(allItems.value, query);
  });

  // A highlighted result that the latest filter (or a new item list) dropped
  // can no longer be selected, so the highlight goes with it.
  watch(visible, (items) => {
    if (activeValue.value && !items.some((item) => item.value === activeValue.value)) {
      activeValue.value = null;
    }
  });

  // Each opening starts from a blank query.
  watch(dialog.open, (isOpen) => {
    if (!isOpen) return;
    inputValue.value = "";
    activeValue.value = null;
  });

  const api = computed(() =>
    core.connect({
      state: {
        open: dialog.open.value,
        value: null,
        inputValue: inputValue.value,
        // There is no selection here, so there is no text to come back to. The
        // query survives because of `settleOnBlur: false` below, not by
        // accident.
        committedInputValue: "",
        activeValue: activeValue.value,
        items: visible.value,
        disabled: false,
        id,
      },
      // Selecting a result runs it; there is no persistent selection.
      setValue: (value) => {
        if (value != null) resolved.value.onSelect?.(value);
      },
      // The combobox "closing" (Escape, select) closes the dialog.
      setOpen: (next) => {
        if (!next) dialog.setOpen(false);
      },
      setActiveValue: (next) => (activeValue.value = next),
      setInputValue: (next) => (inputValue.value = next),
      setCommittedInputValue: () => {},
      // A search dialog keeps what was typed and keeps showing it: losing
      // focus must neither wipe the query nor dismiss the palette, which the
      // dialog itself owns.
      settleOnBlur: false,
      normalize: normalizeProps,
    }),
  );

  const onInputChange = (event: Event) => {
    inputValue.value = (event.target as HTMLInputElement).value;
    // Typing highlights the first match, so Enter runs the top result.
    activeValue.value = core.firstEnabled(visible.value);
  };

  return {
    api,
    dialogApi: dialog.api,
    open: dialog.open,
    setOpen: dialog.setOpen,
    items: visible,
    inputValue,
    onInputChange,
    triggerRef: dialog.triggerRef,
    panelRef: dialog.panelRef,
  };
}
