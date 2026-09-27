import { combobox as core } from "@design-system/core";
import { autoUpdate, flip, offset, shift, size, useFloating } from "@floating-ui/react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ChangeEvent,
  type RefObject,
} from "react";
import { useFormDefault, useFormReset } from "../internal/form-reset";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import { normalizeProps } from "../normalize";

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
  api: core.ComboboxApi;
  /** The currently visible (filtered) items. */
  items: ComboboxItem[];
  inputValue: string;
  value: string | null;
  open: boolean;
  /** Attach to the input; also the positioning reference. */
  inputRef: (node: HTMLInputElement | null) => void;
  /** Attach to the listbox popup. */
  listboxRef: (node: HTMLElement | null) => void;
  /** Attach to the control wrapper so chevron/clear presses count as "inside". */
  controlRef: RefObject<HTMLDivElement | null>;
  /** Absolute-positioning styles for the listbox, from Floating UI. */
  floatingStyles: CSSProperties;
  /** Typing filters, opens and highlights the first match. */
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Pressing the closed input opens the list. */
  onInputPointerDown: (event: ReactPointerEvent<HTMLInputElement>) => void;
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

// The popup is at least as wide as the input it hangs from.
const matchReferenceWidth = size({
  apply({ rects, elements: { floating } }) {
    floating.style.minWidth = `${rects.reference.width}px`;
  },
});

interface InternalState {
  open: boolean;
  value: string | null;
  inputValue: string;
  committedInputValue: string;
  activeValue: string | null;
  items: ComboboxItem[];
}

/**
 * Connect the headless Combobox to React — the adapter's hard case.
 *
 * The core owns the state machine and the ARIA wiring (open/close, arrow
 * navigation, `aria-activedescendant`, selection, Escape). Everything the core
 * deliberately leaves out because it is a DOM concern lives here: text
 * filtering, popup positioning (Floating UI, flip/shift),
 * close-on-outside-pointer, and keeping the active option scrolled into view.
 * DOM focus never leaves the input.
 */
export function useCombobox({
  items: allItems,
  value = null,
  disabled = false,
  filter = defaultFilter,
  onValueChange,
  onInputValueChange,
  onOpenChange,
}: UseComboboxOptions): UseCombobox {
  const id = `ds-combobox-${useId()}`;

  const selectedLabel = useCallback(
    (v: string | null) => {
      const item = allItems.find((i) => i.value === v);
      return item ? labelOf(item) : "";
    },
    [allItems],
  );

  const [state, setState] = useState<InternalState>(() => ({
    open: false,
    value,
    inputValue: selectedLabel(value),
    // The text as it stood at the last selection, so a filter can be undone.
    committedInputValue: selectedLabel(value),
    activeValue: null,
    items: filter(allItems, ""),
  }));

  // Latest inputs, read by event handlers without widening their deps.
  const latest = useRef({ filter, allItems });
  useIsomorphicLayoutEffect(() => {
    latest.current = { filter, allItems };
  });

  // --- Controlled sync: mirror the `value` prop, and the text that goes with
  // it, without an effect (matches the Svelte adapter's reactive statements).
  const [lastValue, setLastValue] = useState(value);
  const [defaultValue, setDefaultValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    // The default a reset restores follows the prop, except when the prop
    // only hands back what the control already holds: that is the page
    // echoing a selection, and an echo is not a new default (ADR 0012).
    if (value !== state.value) setDefaultValue(value);
    setState((s) => ({
      ...s,
      value,
      inputValue: selectedLabel(value),
      committedInputValue: selectedLabel(value),
    }));
  }

  // --- Keep the visible list in step when the item list itself changes. The
  // text follows too, when it is showing the selection: a value whose items
  // arrive later, or whose label changes, would otherwise leave the input
  // empty or stale. Text the user is still editing in an open list stays.
  const [lastItems, setLastItems] = useState(allItems);
  if (allItems !== lastItems) {
    setLastItems(allItems);
    setState((s) => {
      const showsSelection = !s.open || s.inputValue === s.committedInputValue;
      const text = s.value !== null && showsSelection ? selectedLabel(s.value) : null;
      const inputValue = text ?? s.inputValue;
      return {
        ...s,
        inputValue,
        committedInputValue: text ?? s.committedInputValue,
        items: filter(allItems, inputValue),
        activeValue: allItems.some((i) => i.value === s.activeValue) ? s.activeValue : null,
      };
    });
  }

  // --- A control turned off closes its list: the keys that dismiss it live on
  // an input that no longer takes any. Adjusted while rendering, like the
  // controlled sync above, rather than in an effect after the fact.
  const [lastDisabled, setLastDisabled] = useState(disabled);
  if (disabled !== lastDisabled) {
    setLastDisabled(disabled);
    if (disabled) setState((s) => (s.open ? { ...s, open: false, activeValue: null } : s));
  }

  // The setters write first and report afterwards (ADR 0011), from the
  // handler that called them: never from inside a state updater, which React
  // may run twice or while rendering. Like the checkbox's, they close over the
  // state of this render, which is the state the core's handlers act on, and
  // they report only when their own piece of it actually moves.
  const setValue = useCallback(
    (next: string | null) => {
      if (state.value === next) return;
      setState((s) => ({ ...s, value: next }));
      onValueChange?.(next);
    },
    [state.value, onValueChange],
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (state.open === next) return;
      setState((s) => ({ ...s, open: next }));
      onOpenChange?.(next);
    },
    [state.open, onOpenChange],
  );

  const setActiveValue = useCallback((next: string | null) => {
    setState((s) => (s.activeValue === next ? s : { ...s, activeValue: next }));
  }, []);

  const setInputValue = useCallback(
    (next: string) => {
      if (state.inputValue === next) return;
      const items = filter(allItems, next);
      setState((s) => ({ ...s, inputValue: next, items }));
      onInputValueChange?.(next);
    },
    [state.inputValue, filter, allItems, onInputValueChange],
  );

  const setCommittedInputValue = useCallback((next: string) => {
    setState((s) => (s.committedInputValue === next ? s : { ...s, committedInputValue: next }));
  }, []);

  const inputEl = useRef<HTMLInputElement | null>(null);

  // --- Positioning. `whileElementsMounted` is gated on `open` so autoUpdate
  // only tracks scroll/resize while the popup is actually showing. The popup
  // is at least as wide as the input it hangs from, measured on every update
  // so it follows the input while open.
  const { refs, elements, floatingStyles } = useFloating<HTMLInputElement>({
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 }), matchReferenceWidth],
    whileElementsMounted: state.open ? autoUpdate : undefined,
  });

  // The input as positioning holds it, in state, so the core's handlers reach
  // it without a ref being read while rendering.
  const focusInput = useCallback(() => elements.reference?.focus(), [elements.reference]);

  const api = useMemo(
    () =>
      core.connect({
        state: { ...state, disabled, id },
        setValue,
        setOpen,
        setActiveValue,
        setInputValue,
        setCommittedInputValue,
        focusInput,
        normalize: normalizeProps,
      }),
    [
      state,
      disabled,
      id,
      setValue,
      setOpen,
      setActiveValue,
      setInputValue,
      setCommittedInputValue,
      focusInput,
    ],
  );

  const controlRef = useRef<HTMLDivElement>(null);
  const listboxEl = useRef<HTMLElement | null>(null);

  const inputRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputEl.current = node;
      refs.setReference(node);
    },
    [refs],
  );

  const listboxRef = useCallback(
    (node: HTMLElement | null) => {
      listboxEl.current = node;
      refs.setFloating(node);
    },
    [refs],
  );

  // The value travels in a hidden input, whose value is its own default, so a
  // form reset leaves it exactly where it was: the whole restore happens here.
  // The text goes back with the selection, and so does the text an Escape
  // would settle on.
  useFormReset(inputEl, () => {
    const text = selectedLabel(defaultValue);
    setState((s) => ({
      ...s,
      value: defaultValue,
      inputValue: text,
      committedInputValue: text,
      items: latest.current.filter(latest.current.allItems, ""),
      activeValue: null,
    }));
  });

  // The text the browser's own reset puts back into the visible box, so it
  // does not blink through an empty one on the way to the restore.
  //
  // Written after every render on purpose: React keeps a text box's default in
  // step with its value, and it does that in whichever render writes the
  // value, which is not always one this control can name in advance.
  useFormDefault(inputEl, (node: HTMLInputElement) => {
    node.defaultValue = selectedLabel(defaultValue);
  });

  // --- Close when a pointer goes down anywhere outside the control or popup.
  useEffect(() => {
    if (!state.open) return;

    const onPointerDown = (event: Event) => {
      const target = event.target as Node;
      if (
        controlRef.current?.contains(target) ||
        inputEl.current?.contains(target) ||
        listboxEl.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setActiveValue(null);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [state.open, setOpen, setActiveValue]);

  // --- Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!state.open) return;
    const frame = requestAnimationFrame(() => {
      listboxEl.current
        ?.querySelector<HTMLElement>("[data-active]")
        ?.scrollIntoView?.({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [state.open, state.activeValue]);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      const next = latest.current.filter(latest.current.allItems, text);
      setInputValue(text);
      // Typing highlights the first match, and opens the list if it was closed.
      setActiveValue(core.firstEnabled(next));
      setOpen(true);
    },
    [setInputValue, setActiveValue, setOpen],
  );

  const onInputPointerDown = useCallback(() => {
    if (!state.open) api.openListbox();
  }, [state.open, api]);

  // Show every option (ignoring the typed text) so a chosen value can be
  // changed without clearing it first.
  const openAll = useCallback(() => {
    const items = filter(allItems, "");
    // No first-item pre-highlight; only the selected value (if any).
    setState((s) => ({ ...s, open: true, items, activeValue: s.value }));
    inputEl.current?.focus();
    if (!state.open) onOpenChange?.(true);
  }, [state.open, filter, allItems, onOpenChange]);

  return {
    api,
    items: state.items,
    inputValue: state.inputValue,
    value: state.value,
    open: state.open,
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
