import { multiSelect as core } from "@design-system/core";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type RefCallback,
  type RefObject,
} from "react";
import { fail } from "../internal/dev";
import { normalizeProps } from "../normalize";

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
  api: core.MultiSelectApi;
  /** The currently visible (filtered) items. */
  items: MultiSelectItem[];
  inputValue: string;
  values: string[];
  open: boolean;
  /** Ref callback for the input; also the positioning reference. */
  inputRef: RefCallback<HTMLInputElement>;
  /** Ref callback for the listbox popup. */
  listboxRef: RefCallback<HTMLElement>;
  /** Ref for the control wrapper, so inner presses count as "inside". */
  controlRef: RefObject<HTMLDivElement | null>;
  /** The input element, for imperative focus after a removal. */
  inputEl: RefObject<HTMLInputElement | null>;
  /** Absolute-positioning styles for the listbox, from Floating UI. */
  floatingStyles: CSSProperties;
  /** Typing filters, opens and highlights the first match. */
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Pressing the closed input opens the list. */
  onInputPointerDown: () => void;
  setOpen: (open: boolean) => void;
}

const defaultFilter = (items: MultiSelectItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

// A stable default: a fresh [] per render would defeat the identity mirror.
const NO_VALUES: string[] = [];

const valuesEqual = (a: string[], b: string[]) =>
  a === b || (a.length === b.length && a.every((value, index) => value === b[index]));

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

interface InternalState {
  open: boolean;
  values: string[];
  inputValue: string;
  activeValue: string | null;
  items: MultiSelectItem[];
}

/**
 * Connect the headless Multi Select to React. The core owns the state machine
 * and the ARIA wiring (open/close, arrow navigation, `aria-activedescendant`,
 * multi selection, Escape, the Backspace policy). The DOM concerns live here:
 * text filtering, popup positioning (Floating UI, flip/shift),
 * close-on-outside-pointer and keeping the active option scrolled into view.
 * DOM focus never leaves the input.
 */
export function useMultiSelect({
  items: allItems,
  values: controlledValues = NO_VALUES,
  disabled = false,
  readOnly = false,
  max,
  removeOnBackspace = false,
  filter = defaultFilter,
  onValuesChange,
  onInputValueChange,
  onOpenChange,
}: UseMultiSelectOptions): UseMultiSelect {
  const id = `ds-multi-select-${useId()}`;

  const [state, setState] = useState<InternalState>(() => {
    assertUniqueValues(controlledValues);
    return {
      open: false,
      values: controlledValues,
      inputValue: "",
      activeValue: null,
      items: filter(allItems, ""),
    };
  });

  // Latest callbacks/inputs, read inside setState updaters without widening deps.
  const latest = useRef({ filter, allItems, onValuesChange, onInputValueChange, onOpenChange });
  latest.current = { filter, allItems, onValuesChange, onInputValueChange, onOpenChange };

  // --- Controlled sync: mirror the `values` prop without an effect (matches
  // the Svelte adapter's reactive statements). Reflection never calls back;
  // a give-back with equal content never churns.
  const [lastValues, setLastValues] = useState(controlledValues);
  if (controlledValues !== lastValues) {
    setLastValues(controlledValues);
    assertUniqueValues(controlledValues);
    setState((s) =>
      valuesEqual(s.values, controlledValues) ? s : { ...s, values: controlledValues },
    );
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

  const setValues = useCallback((next: string[]) => {
    setState((s) => {
      if (valuesEqual(s.values, next)) return s;
      latest.current.onValuesChange?.(next);
      return { ...s, values: next };
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
        state: {
          ...state,
          disabled,
          readOnly,
          max: max ?? null,
          removeOnBackspace,
          id,
        },
        setValues,
        setOpen,
        setActiveValue,
        setInputValue,
        normalize: normalizeProps,
      }),
    [
      state,
      disabled,
      readOnly,
      max,
      removeOnBackspace,
      id,
      setValues,
      setOpen,
      setActiveValue,
      setInputValue,
    ],
  );

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
    if (!state.open || !listboxEl.current) return;
    const reference = controlRef.current ?? inputEl.current;
    if (reference) listboxEl.current.style.minWidth = `${reference.offsetWidth}px`;
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

  return {
    api,
    items: state.items,
    inputValue: state.inputValue,
    values: state.values,
    open: state.open,
    inputRef,
    listboxRef,
    controlRef,
    inputEl,
    floatingStyles,
    onInputChange,
    onInputPointerDown,
    setOpen,
  };
}
