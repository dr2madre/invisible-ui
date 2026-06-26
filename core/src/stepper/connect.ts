import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { canGoTo, clampStep, stepStatus } from "./state";
import type { StepperState, StepStatus } from "./types";

/** The public, framework-agnostic API for a connected stepper. */
export interface StepperApi {
  /** Current step (0-based). */
  current: number;
  /** Total number of steps. */
  count: number;
  /** Advance to the next step (clamped; ignored while disabled). */
  next(): void;
  /** Go back to the previous step (clamped; ignored while disabled). */
  prev(): void;
  /** Jump to a step (ignored when it isn't reachable). */
  goTo(index: number): void;
  /** Whether a step can be navigated to directly. */
  canGoTo(index: number): boolean;
  /** A step's status relative to the current position. */
  status(index: number): StepStatus;
  /** Props for the container (render on a `<nav>`). */
  rootProps: ElementProps;
  /** Props for the ordered step list (render on an `<ol>`). */
  getListProps(): ElementProps;
  /** Props for a single step's clickable trigger (`<button>`), by index. */
  getStepProps(index: number): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: StepperState;
  /** Request a new current step; the adapter owns how state updates. */
  setStep: (step: number) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect stepper state to prop getters. There is no dedicated ARIA "stepper"
 * role, so this uses the conventional accessible pattern: a labelled `<nav>`
 * wrapping an ordered list of steps, with the current step marked
 * `aria-current="step"`. Each step's trigger is a button that is disabled when
 * the step isn't reachable (e.g. an upcoming step in linear mode).
 */
export function connect({
  state,
  setStep,
  normalize = identityNormalize,
}: ConnectOptions): StepperApi {
  const { current, count, orientation, disabled } = state;

  const go = (index: number) => {
    if (!canGoTo(state, index)) return;
    if (index !== current) setStep(index);
  };

  const next = () => {
    if (disabled) return;
    const target = clampStep(current + 1, count);
    if (target !== current) setStep(target);
  };

  const prev = () => {
    if (disabled) return;
    const target = clampStep(current - 1, count);
    if (target !== current) setStep(target);
  };

  return {
    current,
    count,
    next,
    prev,
    goTo: go,
    canGoTo: (index: number) => canGoTo(state, index),
    status: (index: number) => stepStatus(state, index),
    // Orientation is purely visual; `aria-orientation` isn't valid on the
    // wrapping `nav` (role="navigation"), so it's only a styling hook here.
    rootProps: normalize({
      "data-orientation": orientation,
      "data-disabled": disabled ? "" : undefined,
    }),
    getListProps: () =>
      normalize({
        "data-orientation": orientation,
      }),
    getStepProps: (index: number) => {
      const status = stepStatus(state, index);
      const reachable = canGoTo(state, index);
      return normalize({
        type: "button",
        id: `${state.id}-step-${index}`,
        "aria-current": status === "current" ? "step" : undefined,
        disabled: reachable ? undefined : true,
        "data-status": status,
        "data-disabled": reachable ? undefined : "",
        "data-value": String(index),
        onClick: () => go(index),
      });
    },
  };
}
