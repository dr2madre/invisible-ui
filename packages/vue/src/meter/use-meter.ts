import { meter as core } from "@design-system/core";
import { computed, ref, type ComputedRef } from "vue";
import { normalizeProps } from "../normalize";

export type MeterApi = core.MeterApi;
export type MeterState = core.MeterState;
export type MeterContext = core.MeterContext;

export interface UseMeter {
  /** Reactive connected API; spread `api.value.rootProps` / `indicatorProps`. */
  api: ComputedRef<MeterApi>;
  /** Filled fraction as a 0–100 percentage. */
  percentage: ComputedRef<number>;
  /** Band relative to the low/high thresholds. */
  level: ComputedRef<"low" | "medium" | "high">;
  /** Replace the current value. */
  setValue: (value: number) => void;
}

/**
 * Connect the headless meter (WAI-ARIA meter pattern) to Vue: a gauge of a
 * value within a known range. Behaviour and accessibility live in
 * `@design-system/core`; this composable wires the state to a ref and derives
 * the connected props with `computed(connect)`, like the other composables. The
 * element still needs an accessible name, supplied by the consumer
 * (`aria-label`).
 */
export function useMeter(context: MeterContext = {}): UseMeter {
  const state = ref<MeterState>(core.initialState(context));

  const setValue = (value: number) => {
    state.value = { ...state.value, value };
  };

  const api = computed(() => core.connect({ state: state.value, normalize: normalizeProps }));

  return {
    api,
    percentage: computed(() => api.value.percentage),
    level: computed(() => api.value.level),
    setValue,
  };
}
