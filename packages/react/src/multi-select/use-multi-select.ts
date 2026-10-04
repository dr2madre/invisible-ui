import { multiSelect as core } from "@design-system/core";
import {
  useCallback,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type RefCallback,
  type RefObject,
} from "react";
import { sameList } from "../internal/controllable";
import { fail } from "../internal/dev";
import { useControlledDefault, useFormReset } from "../internal/form-reset";
import { useListboxPopup } from "../internal/listbox-popup";
import { defaultFilter, useListboxState } from "../internal/listbox-state";
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

// A stable default: a fresh [] per render would defeat the identity mirror.
const NO_VALUES: string[] = [];

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

  // --- Controlled sync: mirror the `values` prop without an effect (matches
  // the Svelte adapter's reactive statements). Reflection never calls back;
  // a give-back with equal content never churns.
  const defaultValues = useControlledDefault(
    controlledValues,
    state.values,
    (next) => {
      assertUniqueValues(next);
      setState((s) => (sameList(s.values, next) ? s : { ...s, values: next }));
    },
    sameList,
  );

  // --- The visible list follows the item list; the open, highlight and text
  // setters are the shared ones.
  const { latest, setOpen, setActiveValue, setInputValue, onInputChange } = useListboxState({
    state,
    setState,
    allItems,
    filter,
    onInputValueChange,
    onOpenChange,
  });

  // --- A control turned off, or turned review-only, closes its list: the keys
  // that dismiss it live on an input that no longer takes any. Adjusted while
  // rendering, like the controlled sync above, rather than in an effect.
  const inert = disabled || readOnly;
  const [lastInert, setLastInert] = useState(inert);
  if (inert !== lastInert) {
    setLastInert(inert);
    if (inert) setState((s) => (s.open ? { ...s, open: false, activeValue: null } : s));
  }

  // The selection setter writes first and reports afterwards, like the shared
  // setters (ADR 0011), and only when the selection actually moves.
  const setValues = useCallback(
    (next: string[]) => {
      if (sameList(state.values, next)) return;
      setState((s) => ({ ...s, values: next }));
      onValuesChange?.(next);
    },
    [state.values, onValuesChange],
  );

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

  // --- Positioning, outside presses and the active option in view. The popup
  // is at least as wide as the control it hangs from, which tags wrapping onto
  // a new line or a resized container change while it is open.
  const { inputRef, listboxRef, controlRef, inputEl, floatingStyles } = useListboxPopup({
    open: state.open,
    activeValue: state.activeValue,
    setOpen,
    setActiveValue,
    widthOf: "control",
  });

  // The values travel in hidden inputs, whose values are their own defaults,
  // so a form reset leaves them exactly where they were: the whole restore
  // happens here, the query included. Nothing else clears that box, because
  // React keeps a controlled box's default equal to the text it renders.
  useFormReset(inputEl, () => {
    setState((s) => ({
      ...s,
      values: defaultValues,
      inputValue: "",
      items: latest.current.filter(latest.current.allItems, ""),
      activeValue: null,
    }));
  });

  const onInputPointerDown = () => {
    if (!state.open) api.openListbox();
  };

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
