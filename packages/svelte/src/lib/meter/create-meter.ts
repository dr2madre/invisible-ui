import { meter as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
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
  const state = writable<MeterState>(core.initialState(context));

  const setValue = (value: number) => {
    state.update((current) => ({ ...current, value }));
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, normalize: normalizeProps }),
  );

  return {
    state,
    api,
    percentage: derived(api, ($api) => $api.percentage),
    setValue,
    rootAction: createPropsAction(api, (a) => a.rootProps),
    indicatorAction: createPropsAction(api, (a) => a.indicatorProps),
  };
}
