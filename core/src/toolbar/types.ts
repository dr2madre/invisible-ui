/**
 * Toolbar — the shared part of a toolbar's keyboard model, following the
 * WAI-ARIA toolbar pattern: one tab stop for the whole group, and arrow keys
 * that move between the controls inside it.
 *
 * Which elements are in the toolbar, and moving real focus, are questions only
 * the DOM can answer, so they stay with the adapters. What is shared is the
 * arithmetic: given where focus is and which key was pressed, where does focus
 * go next.
 */

export type ToolbarOrientation = "horizontal" | "vertical";

/** Reading direction, which decides what the left and right arrows mean. */
export type ToolbarDirection = "ltr" | "rtl";

export interface ToolbarMoveOptions {
  /** The key the user pressed. */
  key: string;
  /** Index of the control that has focus. */
  index: number;
  /** How many controls the toolbar holds. */
  count: number;
  orientation?: ToolbarOrientation;
  /** Defaults to `"ltr"`. In right-to-left text the arrows swap sides. */
  direction?: ToolbarDirection;
}
