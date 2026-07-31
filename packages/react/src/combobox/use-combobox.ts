import { combobox as core } from "@design-system/core";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react-dom";
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

interface InternalState {
  open: boolean;
  value: string | null;
  inputValue: string;
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
    activeValue: null,
    items: filter(allItems, ""),
  }));

  // Latest callbacks/inputs, read inside setState updaters without widening deps.
  const latest = useRef({ filter, allItems, onValueChange, onInputValueChange, onOpenChange });
  latest.current = { filter, allItems, onValueChange, onInputValueChange, onOpenChange };

  // --- Controlled sync: mirror the `value` prop, and the text that goes with
  // it, without an effect (matches the Svelte adapter's reactive statements).
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setState((s) => ({ ...s, value, inputValue: selectedLabel(value) }));
  }

  // --- Keep the visible list in step when the item list itself changes.
  const [lastItems, setLastItems] = useState(allItems);
  if (allItems !== lastItems) {
    setLastItems(allItems);
    setState((s) => ({
      ...s,
      items: filter(allItems, s.inputValue),
      activeValue: allItems.some((i) => i.value === s.activeValue) ? s.activeValue : null,
    }));
  }

  const setValue = useCallback((next: string | null) => {
    setState((s) => {
      if (s.value === next) return s;
      latest.current.onValueChange?.(next);
      return { ...s, value: next };
    });
  }, []);

  const setOpen = useCallback((next: boolean) => {
    setState((s) => {
      if (s.open === next) return s;
      latest.current.onOpenChange?.(next);
      return { ...s, open: next };
    });
  }, []);

  const setActiveValue = useCallback((next: string | null) => {
    setState((s) => (s.activeValue === next ? s : { ...s, activeValue: next }));
  }, []);

  const setInputValue = useCallback((next: string) => {
    setState((s) => {
      if (s.inputValue === next) return s;
      latest.current.onInputValueChange?.(next);
      return {
        ...s,
        inputValue: next,
        items: latest.current.filter(latest.current.allItems, next),
      };
    });
  }, []);

  const api = useMemo(
    () =>
      core.connect({
        state: { ...state, disabled, id },
        setValue,
        setOpen,
        setActiveValue,
        setInputValue,
        normalize: normalizeProps,
      }),
    [state, disabled, id, setValue, setOpen, setActiveValue, setInputValue],
  );

  // --- Positioning. `whileElementsMounted` is gated on `open` so autoUpdate
  // only tracks scroll/resize while the popup is actually showing.
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: state.open ? autoUpdate : undefined,
  });

  const controlRef = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement | null>(null);
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

  // --- The popup is at least as wide as the control it hangs from.
  useEffect(() => {
    if (!state.open || !listboxEl.current || !inputEl.current) return;
    listboxEl.current.style.minWidth = `${inputEl.current.offsetWidth}px`;
  }, [state.open]);

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
    setState((s) => {
      if (!s.open) latest.current.onOpenChange?.(true);
      return {
        ...s,
        open: true,
        items: latest.current.filter(latest.current.allItems, ""),
        // No first-item pre-highlight; only the selected value (if any).
        activeValue: s.value,
      };
    });
    inputEl.current?.focus();
  }, []);

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
