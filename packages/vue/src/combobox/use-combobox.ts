import { combobox as core } from "@design-system/core";
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";
import {
  computed,
  onScopeDispose,
  ref,
  shallowRef,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
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
  setOpen: (open: boolean) => void;
}

const defaultFilter = (items: ComboboxItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

const labelOf = (item: ComboboxItem) => item.label ?? item.value;

const PLACEMENT: Placement = "bottom-start";

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
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

  // Keep the visible list in step when the item list itself changes.
  watch(allItems, (items) => {
    visibleItems.value = filterFn.value(items, inputValue.value);
    if (!items.some((item) => item.value === activeValue.value)) activeValue.value = null;
  });

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

  const api = computed(() =>
    core.connect({
      state: {
        open: open.value,
        value: value.value,
        inputValue: inputValue.value,
        activeValue: activeValue.value,
        items: visibleItems.value,
        disabled: resolved.value.disabled ?? false,
        id,
      },
      setValue,
      setOpen,
      setActiveValue,
      setInputValue,
      normalize: normalizeProps,
    }),
  );

  const inputRef = ref<HTMLInputElement | null>(null);
  const listboxRef = ref<HTMLElement | null>(null);
  const controlRef = ref<HTMLElement | null>(null);

  // --- Positioning. Floating UI writes into `x`/`y`, which the component binds
  // as inline styles on the listbox.
  const x = ref(0);
  const y = ref(0);
  const floatingStyles = computed(() => ({
    position: "fixed",
    left: `${x.value}px`,
    top: `${y.value}px`,
  }));

  const reposition = () => {
    const reference = inputRef.value;
    const floating = listboxRef.value;
    if (!reference || !floating) return;
    void computePosition(reference, floating, {
      placement: PLACEMENT,
      strategy: "fixed",
      middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then((position) => {
      x.value = position.x;
      y.value = position.y;
    });
  };

  // --- Close when a pointer goes down anywhere outside the control or popup.
  const onOutsidePointer = (event: Event) => {
    const target = event.target as Node;
    if (
      controlRef.value?.contains(target) ||
      inputRef.value?.contains(target) ||
      listboxRef.value?.contains(target)
    ) {
      return;
    }
    setOpen(false);
    setActiveValue(null);
  };

  let stopAutoUpdate: (() => void) | null = null;

  const teardownOpen = () => {
    stopAutoUpdate?.();
    stopAutoUpdate = null;
    document.removeEventListener("pointerdown", onOutsidePointer, true);
  };

  watch(
    open,
    (isOpen) => {
      if (!isOpen) {
        teardownOpen();
        return;
      }
      const reference = inputRef.value;
      const floating = listboxRef.value;
      if (!reference || !floating || stopAutoUpdate) return;

      // The popup is at least as wide as the control it hangs from.
      floating.style.minWidth = `${reference.offsetWidth}px`;
      // `autoUpdate` needs ResizeObserver; where it is missing (jsdom) a single
      // measurement is enough.
      stopAutoUpdate =
        typeof ResizeObserver !== "undefined"
          ? autoUpdate(reference, floating, reposition)
          : (reposition(), () => {});
      document.addEventListener("pointerdown", onOutsidePointer, true);
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

  onScopeDispose(teardownOpen);

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
    setOpen,
  };
}
