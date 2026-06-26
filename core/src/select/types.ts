/**
 * A select — the collapsible single-select listbox (WAI-ARIA "select-only
 * combobox" pattern). A button trigger opens a popup `listbox` of `option`s;
 * the active option is tracked with `aria-activedescendant` (DOM focus stays on
 * the trigger), and selection is committed on Enter / click. Positioning of the
 * popup is a DOM concern owned by the adapter, not this pure-state primitive.
 */

/** A selectable option in a select. */
export interface SelectItem {
  value: string;
  /** Visible label; used for the trigger text and typeahead. Falls back to `value`. */
  label?: string;
  disabled?: boolean;
}

/** Internal, fully-resolved state of a select. */
export interface SelectState {
  /** Whether the listbox popup is open. */
  open: boolean;
  /** The selected value, or `null`. */
  value: string | null;
  /** The active (highlighted) option for `aria-activedescendant`, or `null`. */
  activeValue: string | null;
  items: SelectItem[];
  /** Whether the whole control is disabled. */
  disabled: boolean;
  /** Base id used to link the label, trigger, listbox and options. */
  id: string;
}

/** User-provided options when creating a select. */
export interface SelectContext {
  /** Initial / controlled selected value. Defaults to `null`. */
  value?: string | null;
  /** Ordered list of options. */
  items: SelectItem[];
  /** Whether the control is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Base id used to link parts. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
  /** Called whenever the open state changes. */
  onOpenChange?: (open: boolean) => void;
}
