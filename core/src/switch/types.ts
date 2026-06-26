/** Internal, fully-resolved state of a Switch. */
export interface SwitchState {
  checked: boolean;
  disabled: boolean;
}

/** User-provided options when creating a Switch. */
export interface SwitchContext {
  /** Initial / controlled checked value. Defaults to `false`. */
  checked?: boolean;
  /** Whether the switch is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Called whenever the checked value changes. */
  onCheckedChange?: (checked: boolean) => void;
}
