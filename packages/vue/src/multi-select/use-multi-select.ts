import { multiSelect as core } from "@design-system/core";
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
import { fail } from "../internal/dev";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type MultiSelectItem = core.MultiSelectItem;

export interface UseMultiSelectOptions {
  /** Ordered list of all options; filtering is applied here, in the adapter. */
  items: MultiSelectItem[];
  /** Selected values (controlled): ordered, unique. */
  values?: string[];
  disabled?: boolean;
  /** Review-only: focus works, opening/adding/removing do not. */
  readOnly?: boolean;
  /** Cap on additions; never removes existing values. */
  max?: number;
  /** Opt in to Backspace removal from an empty input. Defaults to `false`. */
  removeOnBackspace?: boolean;
  /**
   * How to filter items against the current input text. Defaults to a
   * case-insensitive substring match on the label; an empty query matches all.
   */
  filter?: (items: MultiSelectItem[], query: string) => MultiSelectItem[];
  onValuesChange?: (values: string[]) => void;
  onInputValueChange?: (text: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export interface UseMultiSelect {
  /** The connected core API: prop bags plus imperative helpers. */
  api: ComputedRef<core.MultiSelectApi>;
  /** The currently visible (filtered) items. */
  items: ComputedRef<MultiSelectItem[]>;
  inputValue: ComputedRef<string>;
  values: ComputedRef<string[]>;
  open: ComputedRef<boolean>;
  /** Template ref for the input; also the positioning reference. */
  inputRef: Ref<HTMLInputElement | null>;
  /** Template ref for the listbox popup. */
  listboxRef: Ref<HTMLElement | null>;
  /** Template ref for the control wrapper, so inner presses count as "inside". */
  controlRef: Ref<HTMLElement | null>;
  /** Absolute-positioning styles for the listbox, from Floating UI. */
  floatingStyles: ComputedRef<Record<string, string>>;
  /** Typing filters, opens and highlights the first match. */
  onInputChange: (event: Event) => void;
  /** Pressing the closed input opens the list. */
  onInputPointerDown: () => void;
  setOpen: (open: boolean) => void;
}

const defaultFilter = (items: MultiSelectItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

const PLACEMENT: Placement = "bottom-start";

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
 * Connect the headless Multi Select to Vue. The core owns the state machine
 * and the ARIA wiring (open/close, arrow navigation, `aria-activedescendant`,
 * multi selection, Escape, the Backspace policy). The DOM concerns live here:
 * text filtering, popup positioning (`@floating-ui/dom`, flip/shift),
 * close-on-outside-pointer and keeping the active option scrolled into view.
 * DOM focus never leaves the input.
 */
export function useMultiSelect(options: MaybeRefOrGetter<UseMultiSelectOptions>): UseMultiSelect {
  const id = useStableId("ds-multi-select");
  const resolved = computed(() => toValue(options));
  const allItems = computed(() => resolved.value.items);
  const filterFn = computed(() => resolved.value.filter ?? defaultFilter);

  const open = ref(false);
  const values = ref<string[]>(resolved.value.values ?? []);
  assertUniqueValues(values.value);
  const inputValue = ref("");
  const activeValue = ref<string | null>(null);
  const visibleItems = shallowRef<MultiSelectItem[]>(filterFn.value(allItems.value, ""));

  const valuesEqual = (a: string[], b: string[]) =>
    a === b || (a.length === b.length && a.every((value, index) => value === b[index]));

  // Mirror the controlled values: reflection never calls the callback, and a
  // give-back with the same content never churns.
  watch(
    () => resolved.value.values,
    (next) => {
      if (!next) return;
      assertUniqueValues(next);
      if (!valuesEqual(values.value, next)) values.value = next;
    },
  );

  // Keep the visible list in step when the item list itself changes.
  watch(allItems, (items) => {
    visibleItems.value = filterFn.value(items, inputValue.value);
    if (!items.some((item) => item.value === activeValue.value)) activeValue.value = null;
  });

  const setValues = (next: string[]) => {
    if (valuesEqual(values.value, next)) return;
    values.value = next;
    resolved.value.onValuesChange?.(next);
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
        values: values.value,
        inputValue: inputValue.value,
        activeValue: activeValue.value,
        items: visibleItems.value,
        disabled: resolved.value.disabled ?? false,
        readOnly: resolved.value.readOnly ?? false,
        max: resolved.value.max ?? null,
        removeOnBackspace: resolved.value.removeOnBackspace ?? false,
        id,
      },
      setValues,
      setOpen,
      setActiveValue,
      setInputValue,
      normalize: normalizeProps,
    }),
  );

  const inputRef = ref<HTMLInputElement | null>(null);
  const listboxRef = ref<HTMLElement | null>(null);
  const controlRef = ref<HTMLElement | null>(null);

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
      floating.style.minWidth = `${controlRef.value?.offsetWidth ?? reference.offsetWidth}px`;
      stopAutoUpdate =
        typeof ResizeObserver !== "undefined"
          ? autoUpdate(reference, floating, reposition)
          : (reposition(), () => {});
      document.addEventListener("pointerdown", onOutsidePointer, true);
    },
    { flush: "post" },
  );

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
    setActiveValue(core.firstEnabled(visibleItems.value));
    setOpen(true);
  };

  const onInputPointerDown = () => {
    if (!open.value) api.value.openListbox();
  };

  return {
    api,
    items: computed(() => visibleItems.value),
    inputValue: computed(() => inputValue.value),
    values: computed(() => values.value),
    open: computed(() => open.value),
    inputRef,
    listboxRef,
    controlRef,
    floatingStyles,
    onInputChange,
    onInputPointerDown,
    setOpen,
  };
}
