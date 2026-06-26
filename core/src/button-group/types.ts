export type Orientation = "horizontal" | "vertical";

/**
 * Internal, fully-resolved state of a button group. A button group is a
 * semantic + visual grouping of related action buttons — unlike a radio group
 * or segmented control it holds no selection; each button stays an independent
 * action and an independent tab stop.
 */
export interface ButtonGroupState {
  orientation: Orientation;
  /** Accessible name for the group. */
  label?: string;
}

/** User-provided options when creating a button group. */
export interface ButtonGroupContext {
  /** Layout orientation (affects `aria-orientation`). Defaults to `horizontal`. */
  orientation?: Orientation;
  /** Accessible name for the group (recommended for `role="group"`). */
  label?: string;
}
