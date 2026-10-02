import { combobox as core } from "@design-system/core";
import {
  useCallback,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ChangeEvent,
  type RefObject,
} from "react";
import { useControlledDefault, useFormDefault, useFormReset } from "../internal/form-reset";
import { useListboxPopup } from "../internal/listbox-popup";
import { defaultFilter, useListboxState } from "../internal/listbox-state";
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

const labelOf = (item: ComboboxItem) => item.label ?? item.value;

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

  const selectedLabel = (v: string | null) => {
    const item = allItems.find((i) => i.value === v);
    return item ? labelOf(item) : "";
  };

  const [state, setState] = useState<InternalState>(() => ({
    open: false,
    value,
    inputValue: selectedLabel(value),
    // The text as it stood at the last selection, so a filter can be undone.
    committedInputValue: selectedLabel(value),
    activeValue: null,
    items: filter(allItems, ""),
  }));

  // --- Controlled sync: mirror the `value` prop, and the text that goes with
  // it, without an effect (matches the Svelte adapter's reactive statements).
  const defaultValue = useControlledDefault(value, state.value, (next) =>
    setState((s) => ({
      ...s,
      value: next,
      inputValue: selectedLabel(next),
      committedInputValue: selectedLabel(next),
    })),
  );

  // --- The visible list follows the item list, and so does the text, when it
  // is showing the selection: a value whose items arrive later, or whose label
  // changes, would otherwise leave the input empty or stale. Text the user is
  // still editing in an open list stays.
  const { latest, setOpen, setActiveValue, setInputValue, onInputChange } = useListboxState({
    state,
    setState,
    allItems,
    filter,
    onInputValueChange,
    onOpenChange,
    followItems: (s) => {
      const showsSelection = !s.open || s.inputValue === s.committedInputValue;
      const text = s.value !== null && showsSelection ? selectedLabel(s.value) : null;
      return {
        ...s,
        inputValue: text ?? s.inputValue,
        committedInputValue: text ?? s.committedInputValue,
      };
    },
  });

  // --- A control turned off closes its list: the keys that dismiss it live on
  // an input that no longer takes any. Adjusted while rendering, like the
  // controlled sync above, rather than in an effect after the fact.
  const [lastDisabled, setLastDisabled] = useState(disabled);
  if (disabled !== lastDisabled) {
    setLastDisabled(disabled);
    if (disabled) setState((s) => (s.open ? { ...s, open: false, activeValue: null } : s));
  }

  // The selection setter writes first and reports afterwards, like the shared
  // setters (ADR 0011), and only when the selection actually moves.
  const setValue = useCallback(
    (next: string | null) => {
      if (state.value === next) return;
      setState((s) => ({ ...s, value: next }));
      onValueChange?.(next);
    },
    [state.value, onValueChange],
  );

  const setCommittedInputValue = useCallback((next: string) => {
    setState((s) => (s.committedInputValue === next ? s : { ...s, committedInputValue: next }));
  }, []);

  // --- Positioning, outside presses and the active option in view. The popup
  // is at least as wide as the input it hangs from.
  const { reference, inputRef, listboxRef, controlRef, inputEl, floatingStyles } = useListboxPopup({
    open: state.open,
    activeValue: state.activeValue,
    setOpen,
    setActiveValue,
    widthOf: "input",
  });

  // The input as positioning holds it, in state, so the core's handlers reach
  // it without a ref being read while rendering.
  const focusInput = useCallback(() => reference?.focus(), [reference]);

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

  const onInputPointerDown = () => {
    if (!state.open) api.openListbox();
  };

  // Show every option (ignoring the typed text) so a chosen value can be
  // changed without clearing it first.
  const openAll = useCallback(() => {
    const items = filter(allItems, "");
    // No first-item pre-highlight; only the selected value (if any).
    setState((s) => ({ ...s, open: true, items, activeValue: s.value }));
    inputEl.current?.focus();
    if (!state.open) onOpenChange?.(true);
  }, [state.open, filter, allItems, onOpenChange, inputEl]);

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
