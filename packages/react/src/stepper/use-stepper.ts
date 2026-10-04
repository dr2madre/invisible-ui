import { stepper as core } from "@design-system/core";
import { useId, useMemo } from "react";
import { useControllable } from "../internal/controllable";
import { normalizeProps } from "../normalize";

export type StepStatus = core.StepStatus;
export type StepperOrientation = core.Orientation;

export interface UseStepperOptions {
  /** Total number of steps. */
  count: number;
  /** Initial (uncontrolled) or current (controlled) step, 0-based; clamped to the steps. */
  current?: number;
  /** Linear mode (default): steps ahead of the current one cannot be picked. */
  linear?: boolean;
  orientation?: StepperOrientation;
  disabled?: boolean;
  /** Called whenever the user changes the current step. */
  onStepChange?: (current: number) => void;
}

/**
 * Connect the headless stepper to React: ordered progress through a sequence
 * of steps with `next`, `prev` and `goTo`, linear gating, and the props for
 * a labelled `<nav>` around an `<ol>` with the current step marked
 * `aria-current="step"`. `current` is a controllable mirror (ADR 0011).
 */
export function useStepper({
  count,
  current: currentProp = 0,
  linear = true,
  orientation = "horizontal",
  disabled = false,
  onStepChange,
}: UseStepperOptions): core.StepperApi {
  const id = `ds-stepper-${useId()}`;
  const [own, setOwn] = useControllable(currentProp, undefined);
  const current = core.clampStep(own, count);
  return useMemo(
    () =>
      core.connect({
        state: { current, count, linear, orientation, disabled, id },
        setStep: (next) => {
          setOwn(next);
          onStepChange?.(next);
        },
        normalize: normalizeProps,
      }),
    [current, count, linear, orientation, disabled, id, setOwn, onStepChange],
  );
}
