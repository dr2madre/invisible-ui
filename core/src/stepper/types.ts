export type Orientation = "horizontal" | "vertical";

/** A step's status relative to the current position. */
export type StepStatus = "complete" | "current" | "upcoming";

/** Internal, fully-resolved state of a stepper. */
export interface StepperState {
  /** Current step (0-based). */
  current: number;
  /** Total number of steps. */
  count: number;
  /**
   * Linear mode (default): steps ahead of the current one can't be jumped to
   * (advance via `next`); completed steps remain navigable. Non-linear lets any
   * step be selected directly.
   */
  linear: boolean;
  orientation: Orientation;
  /** Whether the whole control is disabled. */
  disabled: boolean;
  /** Base id (styling/labelling hook). */
  id: string;
}

/** User-provided options when creating a stepper. */
export interface StepperContext {
  /** Total number of steps. */
  count: number;
  /** Current step (0-based). Defaults to `0`. */
  current?: number;
  /** Linear mode. Defaults to `true`. */
  linear?: boolean;
  /** Layout axis. Defaults to `horizontal`. */
  orientation?: Orientation;
  /** Whether the control is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Base id. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the current step changes. */
  onStepChange?: (current: number) => void;
}
