/** Internal, fully-resolved state of a toggle button. */
export interface ToggleButtonState {
  pressed: boolean;
  disabled: boolean;
}

/** User-provided options when creating a toggle button. */
export interface ToggleButtonContext {
  /** Initial / controlled pressed value. Defaults to `false`. */
  pressed?: boolean;
  /** Whether the toggle button is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Called whenever the pressed value changes. */
  onPressedChange?: (pressed: boolean) => void;
}
