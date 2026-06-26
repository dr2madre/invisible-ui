/**
 * A checkbox group — a set of related checkboxes with a shared group name,
 * allowing zero or more selections (WAI-ARIA: a `role="group"` of
 * `role="checkbox"` items). Unlike a radio group, every item is independently
 * focusable (no roving tabindex) and toggled with Space.
 */

/** A checkbox in the group. */
export interface CheckboxGroupItem {
  value: string;
  /** Visible label; falls back to `value`. */
  label?: string;
  disabled?: boolean;
}

/** Internal, fully-resolved state of a checkbox group. */
export interface CheckboxGroupState {
  /** The selected values (order follows toggle order). */
  value: string[];
  items: CheckboxGroupItem[];
  /** Whether the whole group is disabled. */
  disabled: boolean;
}

/** User-provided options when creating a checkbox group. */
export interface CheckboxGroupContext {
  /** Initial / controlled selected values. Defaults to `[]`. */
  value?: string[];
  items: CheckboxGroupItem[];
  /** Whether the whole group is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Called whenever the selected values change. */
  onValueChange?: (value: string[]) => void;
}
