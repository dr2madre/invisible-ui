import { combobox as core } from "@design-system/core";
import {
  computed,
  ref,
  shallowRef,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { onOutsidePointerDown } from "../internal/dismiss";
import { attachFloating } from "../internal/floating";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type ComboboxItem = core.ComboboxItem;

export interface UseComboboxOptions {
  /** Ordered list of all options; filtering is applied here, in the adapter. */
  items: ComboboxItem[];
  /** Selected value (controlled). `null` for none. */
  value?: string | null;
  disabled?: boolean;
  /**
   * How to filter items against the current input text. Defaults to a
   * case-insensitive substring match on the label; an empty query matches all.
   */
  filter?: (items: ComboboxItem[], query: string) => ComboboxItem[];
  onValueChange?: (value: string | null) => void;
  onInputValueChange?: (text: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export interface UseCombobox {
  /** The connected core API: prop bags plus imperative helpers. */
  api: ComputedRef<core.ComboboxApi>;
  /** The currently visible (filtered) items. */
  items: ComputedRef<ComboboxItem[]>;
  inputValue: ComputedRef<string>;
  value: ComputedRef<string | null>;
  open: ComputedRef<boolean>;
  /** Template ref for the input; also the positioning reference. */
  inputRef: Ref<HTMLInputElement | null>;
  /** Template ref for the listbox popup. */
  listboxRef: Ref<HTMLElement | null>;
  /** Template ref for the control wrapper, so chevron/clear presses count as "inside". */
  controlRef: Ref<HTMLElement | null>;
  /** Absolute-positioning styles for the listbox, from Floating UI. */
  floatingStyles: ComputedRef<Record<string, string>>;
  /** Typing filters, opens and highlights the first match. */
  onInputChange: (event: Event) => void;
  /** Pressing the closed input opens the list. */
  onInputPointerDown: () => void;
  /** Open showing *all* options, ignoring the current text (the chevron). */
  openAll: () => void;
  /** Restore the value, its text and the closed list, without callbacks. */
  reset: (value: string | null) => void;
  setOpen: (open: boolean) => void;
}

const defaultFilter = (items: ComboboxItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

const labelOf = (item: ComboboxItem) => item.label ?? item.value;

/**
 * Connect the headless Combobox to Vue, the adapter's hard case.
 *
 * The core owns the state machine and the ARIA wiring (open/close, arrow
 * navigation, `aria-activedescendant`, selection, Escape). Everything the core
 * deliberately leaves out because it is a DOM concern lives here: text
 * filtering, popup positioning (`@floating-ui/dom`, flip/shift),
 * close-on-outside-pointer, and keeping the active option scrolled into view.
 * DOM focus never leaves the input.
 *
 * State lives in refs and `connect()` is recomputed inside a `computed`, so the
 * handlers in the prop bags always close over current state. An externally
 * controlled `value` (and the item list itself) is mirrored by a `watch`, the
 * same shape `useCheckbox` and `useSwitch` follow.
 */
export function useCombobox(options: MaybeRefOrGetter<UseComboboxOptions>): UseCombobox {
  const id = useStableId("ds-combobox");
  const resolved = computed(() => toValue(options));
  const allItems = computed(() => resolved.value.items);
  const filterFn = computed(() => resolved.value.filter ?? defaultFilter);

  const labelFor = (value: string | null) => {
    const item = allItems.value.find((candidate) => candidate.value === value);
    return item ? labelOf(item) : "";
  };

  const open = ref(false);
  const value = ref<string | null>(resolved.value.value ?? null);
  const inputValue = ref(labelFor(resolved.value.value ?? null));
  // The text as it stood at the last selection, so a filter can be undone.
  const committedInputValue = ref(inputValue.value);
  const activeValue = ref<string | null>(null);
  const visibleItems = shallowRef<ComboboxItem[]>(filterFn.value(allItems.value, ""));

  // Mirror the controlled `value`, and the text that goes with it.
  watch(
    () => resolved.value.value ?? null,
    (next) => {
      if (value.value === next) return;
      value.value = next;
      inputValue.value = labelFor(next);
    },
  );

  // Keep the visible list in step when the item list itself changes. Items
  // that arrive after mount (loaded late) also bring the selected value's
  // label: while the list is closed and the text is still the committed one,
  // the text follows the value, as it does at creation.
  watch(allItems, (items) => {
    if (!open.value && inputValue.value === committedInputValue.value) {
      inputValue.value = labelFor(value.value);
      committedInputValue.value = inputValue.value;
      visibleItems.value = filterFn.value(items, "");
    } else {
      visibleItems.value = filterFn.value(items, inputValue.value);
    }
    if (!items.some((item) => item.value === activeValue.value)) activeValue.value = null;
  });

  /**
   * Put the value, the text and the text-as-committed back in one step,
   * without notifying: the form-reset restore. The committed text goes too,
   * or an Escape afterwards would revert to the text the reset replaced. The
   * list closes and its highlight goes with it.
   */
  const reset = (next: string | null) => {
    value.value = next;
    inputValue.value = labelFor(next);
    committedInputValue.value = inputValue.value;
    visibleItems.value = filterFn.value(allItems.value, "");
    activeValue.value = null;
    open.value = false;
  };

  const setValue = (next: string | null) => {
    if (value.value === next) return;
    value.value = next;
    resolved.value.onValueChange?.(next);
  };

  const setOpen = (next: boolean) => {
    if (open.value === next) return;
    open.value = next;
    resolved.value.onOpenChange?.(next);
  };

  const setActiveValue = (next: string | null) => {
    activeValue.value = next;
  };

  const setInputValue = (next: string) => {
    if (inputValue.value === next) return;
    inputValue.value = next;
    visibleItems.value = filterFn.value(allItems.value, next);
    resolved.value.onInputValueChange?.(next);
  };

  // A control turned off closes its list: the keys that dismiss it live on an
  // input that no longer takes any.
  watch(
    () => resolved.value.disabled ?? false,
    (disabled) => {
      if (!disabled || !open.value) return;
      open.value = false;
      activeValue.value = null;
    },
  );

  const api = computed(() =>
    core.connect({
      state: {
        open: open.value,
        value: value.value,
        inputValue: inputValue.value,
        committedInputValue: committedInputValue.value,
        activeValue: activeValue.value,
        items: visibleItems.value,
        disabled: resolved.value.disabled ?? false,
        id,
      },
      setValue,
      setOpen,
      setActiveValue,
      setInputValue,
      setCommittedInputValue: (next) => (committedInputValue.value = next),
      focusInput: () => inputRef.value?.focus(),
      normalize: normalizeProps,
    }),
  );

  const inputRef = ref<HTMLInputElement | null>(null);
  const listboxRef = ref<HTMLElement | null>(null);
  const controlRef = ref<HTMLElement | null>(null);

  // A constant, so a re-render never writes over the coordinates the
  // positioning helper keeps on the element.
  const floatingStyles = computed(() => ({ position: "fixed" }));

  // --- While open: position against the input (the popup at least as wide as
  // the control it hangs from) and close when a pointer goes down anywhere
  // outside the control or popup.
  watch(
    open,
    (isOpen, _previous, onCleanup) => {
      const reference = inputRef.value;
      const floating = listboxRef.value;
      if (!isOpen || !reference || !floating) return;
      const stopFloating = attachFloating(reference, floating, { sameWidth: true });
      const stopOutside = onOutsidePointerDown([controlRef.value, reference, floating], () => {
        setOpen(false);
        setActiveValue(null);
      });
      onCleanup(() => {
        stopFloating();
        stopOutside();
      });
    },
    { flush: "post" },
  );

  // --- Keep the highlighted option in view while arrowing through a long list.
  watch(
    [open, activeValue],
    () => {
      if (!open.value) return;
      requestAnimationFrame(() => {
        listboxRef.value
          ?.querySelector<HTMLElement>("[data-active]")
          ?.scrollIntoView?.({ block: "nearest" });
      });
    },
    { flush: "post" },
  );

  const onInputChange = (event: Event) => {
    const text = (event.target as HTMLInputElement).value;
    setInputValue(text);
    // Typing highlights the first match, and opens the list if it was closed.
    setActiveValue(core.firstEnabled(visibleItems.value));
    setOpen(true);
  };

  const onInputPointerDown = () => {
    if (!open.value) api.value.openListbox();
  };

  // Show every option (ignoring the typed text) so a chosen value can be
  // changed without clearing it first.
  const openAll = () => {
    visibleItems.value = filterFn.value(allItems.value, "");
    // No first-item pre-highlight; only the selected value (if any).
    activeValue.value = value.value;
    setOpen(true);
    inputRef.value?.focus();
  };

  return {
    api,
    items: computed(() => visibleItems.value),
    inputValue: computed(() => inputValue.value),
    value: computed(() => value.value),
    open: computed(() => open.value),
    inputRef,
    listboxRef,
    controlRef,
    floatingStyles,
    onInputChange,
    onInputPointerDown,
    openAll,
    reset,
    setOpen,
  };
}
