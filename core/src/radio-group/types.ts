export type Orientation = "horizontal" | "vertical";

/** A selectable item in a radio group. */
export interface RadioItem {
  value: string;
  disabled?: boolean;
}

/** Internal, fully-resolved state of a radio group. */
export interface RadioGroupState {
  /** The selected value, or `null` when nothing is selected. */
  value: string | null;
  /** Ordered list of items (used for navigation and roving tabindex). */
  items: RadioItem[];
  orientation: Orientation;
  /** Whether the whole group is disabled. */
  disabled: boolean;
}

/** User-provided options when creating a radio group. */
export interface RadioGroupContext {
  /** Initial / controlled selected value. Defaults to `null`. */
  value?: string | null;
  /** Ordered list of items. */
  items: RadioItem[];
  /** Layout orientation (affects `aria-orientation`). Defaults to `vertical`. */
  orientation?: Orientation;
  /** Whether the whole group is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Shared form/group name for the native radio inputs (one is generated if omitted). */
  name?: string;
  /** Called whenever the selected value changes. */
  onValueChange?: (value: string) => void;
}
