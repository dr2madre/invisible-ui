import { meter as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type MeterApi = core.MeterApi;
export type MeterState = core.MeterState;
export type MeterContext = core.MeterContext;

export interface CreateMeter {
  /** Reactive resolved state. */
  state: Readable<MeterState>;
  /** Reactive connected API. */
  api: Readable<MeterApi>;
  /** Filled fraction as a 0–100 percentage. */
  percentage: Readable<number>;
  /** Replace the current value. */
  setValue: (value: number) => void;
  /** Mirror the whole measured range after mount (no callbacks: it is data). */
  sync: (context: core.MeterContext) => void;
  /** Svelte action for the meter element: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for the fill/indicator: `<div use:indicatorAction>`. */
  indicatorAction: Action<HTMLElement>;
}

/**
 * Create a headless meter (WAI-ARIA meter pattern): a gauge of a value within a
 * known range. Behaviour and accessibility live in `@design-system/core`; this
 * adapter wires state to a Svelte store and applies the connected props via
 * actions. The element needs an accessible name, supplied by the consumer.
 */
export function createMeter(context: core.MeterContext = {}): CreateMeter {
  const state = writable<MeterState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-meter") }),
  );

  const setValue = (value: number) => {
    state.update((current) => (current.value === value ? current : { ...current, value }));
  };

  /** Mirror the measured range after mount: a meter's numbers change. */
  const sync = (next: core.MeterContext) => {
    state.update((current) => {
      const resolved = core.initialState({ ...next, id: current.id });
      const changed =
        resolved.value !== current.value ||
        resolved.min !== current.min ||
        resolved.max !== current.max ||
        resolved.low !== current.low ||
        resolved.high !== current.high ||
        resolved.optimum !== current.optimum;
      return changed ? resolved : current;
    });
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, normalize: normalizeProps }),
  );

  return {
    state,
    api,
    percentage: derived(api, ($api) => $api.percentage),
    setValue,
    sync,
    rootAction: createPropsAction(api, (a) => a.rootProps),
    indicatorAction: createPropsAction(api, (a) => a.indicatorProps),
  };
}
