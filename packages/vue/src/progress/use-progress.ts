import { progress as core } from "@design-system/core";
import { computed, ref, type ComputedRef } from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type ProgressApi = core.ProgressApi;
export type ProgressState = core.ProgressState;
export type ProgressContext = core.ProgressContext;

export interface UseProgress {
  /** Reactive connected API; spread `api.value.rootProps` / `indicatorProps`. */
  api: ComputedRef<ProgressApi>;
  /** Completion as a 0–100 percentage, or `null` when indeterminate. */
  percentage: ComputedRef<number | null>;
  /** Replace the current value (`null` for indeterminate). */
  setValue: (value: number | null) => void;
}

/**
 * Connect the headless progress bar (WAI-ARIA progressbar pattern) to Vue.
 * Behaviour and accessibility live in `@design-system/core`; this composable
 * wires the state to a ref and derives the connected props with
 * `computed(connect)`, like the other composables. The element still needs an
 * accessible name, supplied by the consumer (`aria-label`).
 */
export function useProgress(context: core.ProgressContext = {}): UseProgress {
  const state = ref<ProgressState>(
    core.initialState({ ...context, id: context.id ?? useStableId("ds-progress") }),
  );

  const setValue = (value: number | null) => {
    state.value = { ...state.value, value };
  };

  const api = computed(() => core.connect({ state: state.value, normalize: normalizeProps }));

  return {
    api,
    percentage: computed(() => api.value.percentage),
    setValue,
  };
}
