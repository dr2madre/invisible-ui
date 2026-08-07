import { stepper as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type StepperApi = core.StepperApi;
export type StepperState = core.StepperState;
export type StepperOrientation = core.Orientation;
export type StepStatus = core.StepStatus;

export interface UseStepperOptions {
  /** Total number of steps. */
  count: number;
  /** Current step (0-based), controlled. Defaults to `0`. */
  current?: number;
  /**
   * Linear mode (default): steps ahead of the current one stay out of reach
   * (advance via `next`); completed steps remain navigable. Non-linear lets any
   * step be selected directly.
   */
  linear?: boolean;
  /** Layout axis. Defaults to `horizontal`. */
  orientation?: StepperOrientation;
  disabled?: boolean;
  /** Called whenever the current step changes. */
  onStepChange?: (current: number) => void;
}

/**
 * Connect the headless stepper to Vue: ordered progress through a sequence of
 * steps with `next`/`prev`/`goTo`, linear gating, and the conventional
 * accessible markup (a labelled `<nav>` plus `<ol>`, current step
 * `aria-current="step"`). The status and reachability logic live in
 * `@design-system/core`; this composable owns the current step (mirrored by a
 * `watch`) and derives the connected props with `computed(connect)`.
 */
export function useStepper(options: MaybeRefOrGetter<UseStepperOptions>): ComputedRef<StepperApi> {
  const resolved = computed(() => toValue(options));
  // One seeding pass fixes the id, so later states reuse it instead of drawing
  // a fresh one from the core's counter on every recompute.
  const seed = core.initialState({ ...resolved.value, id: useStableId("ds-stepper") });
  const current = ref(seed.current);

  watch(
    () => resolved.value.current,
    (next) => {
      if (next != null) current.value = next;
    },
  );

  const setStep = (step: number) => {
    if (current.value === step) return;
    current.value = step;
    resolved.value.onStepChange?.(step);
  };

  return computed(() =>
    core.connect({
      state: core.initialState({ ...resolved.value, id: seed.id, current: current.value }),
      setStep,
      normalize: normalizeProps,
    }),
  );
}
