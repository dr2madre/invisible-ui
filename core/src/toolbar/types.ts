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
  /**
   * The kind of control that has focus (see `controlKind`). A control that
   * needs a key for itself keeps it: the toolbar does not move focus then.
   * Defaults to `"other"`.
   */
  control?: ToolbarControlKind;
}

/**
 * What the focused control does with the keys: a `"text"` input keeps the
 * arrows that move its caret, and Home and End, which jump to its ends; a
 * `"multiline"` one (a textarea or editable content) keeps all of them.
 */
export type ToolbarControlKind = "text" | "multiline" | "other";

/** The parts of an element `controlKind` reads: a structural slice of the DOM element. */
export interface ToolbarControlLike {
  tagName: string;
  type?: string;
  readOnly?: boolean;
  isContentEditable?: boolean;
}
