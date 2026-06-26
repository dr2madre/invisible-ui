/** A checkbox can be on, off, or in a mixed/indeterminate state. */
export type CheckedState = boolean | "indeterminate";

/** Internal, fully-resolved state of a Checkbox. */
export interface CheckboxState {
  checked: CheckedState;
  disabled: boolean;
}

/** User-provided options when creating a Checkbox. */
export interface CheckboxContext {
  /** Initial / controlled checked value. Defaults to `false`. */
  checked?: CheckedState;
  /** Whether the checkbox is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Called whenever the checked value changes. */
  onCheckedChange?: (checked: CheckedState) => void;
}
