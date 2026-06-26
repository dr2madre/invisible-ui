export type ToggleGroupType = "single" | "multiple";
export type Orientation = "horizontal" | "vertical";

/** A toggle item in a toggle group. */
export interface ToggleGroupItem {
  value: string;
  disabled?: boolean;
}

/** Internal, fully-resolved state of a toggle group. */
export interface ToggleGroupState {
  /** Currently pressed item values. */
  value: string[];
  /** Ordered list of items (used for navigation and roving tabindex). */
  items: ToggleGroupItem[];
  /** `single`: at most one pressed. `multiple`: any number. */
  type: ToggleGroupType;
  orientation: Orientation;
  /** Whether the whole group is disabled. */
  disabled: boolean;
}

/** User-provided options when creating a toggle group. */
export interface ToggleGroupContext {
  /** Initially pressed values. Defaults to none. */
  value?: string[];
  /** Ordered list of items. */
  items: ToggleGroupItem[];
  /** `single` (default): at most one pressed. `multiple`: any number. */
  type?: ToggleGroupType;
  /** Arrow-key axis. Defaults to `horizontal`. */
  orientation?: Orientation;
  /** Whether the whole group is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Called whenever the pressed set changes. */
  onValueChange?: (value: string[]) => void;
}
