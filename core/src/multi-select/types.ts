/**
 * A multi select — an editable text input paired with a filtered listbox and a
 * list of selected values rendered as removable tags. It follows the WAI-ARIA
 * editable combobox pattern with `aria-multiselectable="true"`: DOM focus
 * stays on the input, the highlighted option travels through
 * `aria-activedescendant`, Enter adds the active option and keeps the popup
 * open for another choice. A sibling of Combobox on purpose: the two public
 * contracts stay separate and unconditional.
 */

/** A selectable option in a multi select. */
export interface MultiSelectItem {
  value: string;
  /** Visible label; falls back to `value`. */
  label?: string;
  disabled?: boolean;
}

/** Internal, fully-resolved state of a multi select. */
export interface MultiSelectState {
  /** Whether the listbox popup is open. */
  open: boolean;
  /** The selected values, ordered by selection, unique. */
  values: string[];
  /** The current text in the input (the filter query). */
  inputValue: string;
  /** The active (highlighted) option for `aria-activedescendant`, or `null`. */
  activeValue: string | null;
  /** The currently visible (filtered) items. */
  items: MultiSelectItem[];
  /** Whether the whole control is disabled. */
  disabled: boolean;
  /** Review-only: focus works, opening/adding/removing do not. */
  readOnly: boolean;
  /** Cap on additions; never removes existing values. `null` means no cap. */
  max: number | null;
  /** Whether Backspace in an empty input removes the last removable value. */
  removeOnBackspace: boolean;
  /** Base id used to link the label, input, listbox, options and tag list. */
  id: string;
}

/** User-provided options when creating a multi select. */
export interface MultiSelectContext {
  /** Initial / controlled selected values. Defaults to `[]`. */
  values?: string[];
  /** Initial input text. Defaults to `""`. */
  inputValue?: string;
  /** Ordered list of all options (filtering is applied by the adapter). */
  items: MultiSelectItem[];
  disabled?: boolean;
  readOnly?: boolean;
  /** Cap on additions; never removes existing values. */
  max?: number;
  /** Opt in to Backspace removal from an empty input. Defaults to `false`. */
  removeOnBackspace?: boolean;
  id?: string;
  /** Called whenever the selected values change. */
  onValuesChange?: (values: string[]) => void;
  /** Called whenever the input text changes. */
  onInputValueChange?: (text: string) => void;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}
