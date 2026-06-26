/**
 * A combobox — an editable text input paired with a filtered listbox (WAI-ARIA
 * editable combobox with `aria-autocomplete="list"`). DOM focus stays on the
 * input; the highlighted option is conveyed through `aria-activedescendant`, and
 * selection commits on Enter / click. Filtering, positioning and scroll-into-view
 * are DOM concerns owned by the adapter — this pure primitive owns the state and
 * the ARIA wiring over whatever (already-filtered) items it is given.
 */

/** A selectable option in a combobox. */
export interface ComboboxItem {
  value: string;
  /** Visible label; falls back to `value`. */
  label?: string;
  disabled?: boolean;
}

/** Internal, fully-resolved state of a combobox. */
export interface ComboboxState {
  /** Whether the listbox popup is open. */
  open: boolean;
  /** The selected value, or `null`. */
  value: string | null;
  /** The current text in the input. */
  inputValue: string;
  /** The active (highlighted) option for `aria-activedescendant`, or `null`. */
  activeValue: string | null;
  /** The currently visible (filtered) items. */
  items: ComboboxItem[];
  /** Whether the whole control is disabled. */
  disabled: boolean;
  /** Base id used to link the label, input, listbox and options. */
  id: string;
}

/** User-provided options when creating a combobox. */
export interface ComboboxContext {
  /** Initial / controlled selected value. Defaults to `null`. */
  value?: string | null;
  /** Initial input text. Defaults to `""`. */
  inputValue?: string;
  /** Ordered list of all options (filtering is applied by the adapter). */
  items: ComboboxItem[];
  disabled?: boolean;
  id?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string | null) => void;
  /** Called whenever the input text changes. */
  onInputValueChange?: (text: string) => void;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}
