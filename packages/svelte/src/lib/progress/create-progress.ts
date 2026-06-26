import { progress as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type ProgressApi = core.ProgressApi;
export type ProgressState = core.ProgressState;
export type ProgressContext = core.ProgressContext;

export interface CreateProgress {
  /** Reactive resolved state. */
  state: Readable<ProgressState>;
  /** Reactive connected API. */
  api: Readable<ProgressApi>;
  /** Completion as a 0–100 percentage, or `null` when indeterminate. */
  percentage: Readable<number | null>;
  /** Replace the current value (`null` for indeterminate). */
  setValue: (value: number | null) => void;
  /** Svelte action for the progressbar element: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for the fill/indicator: `<div use:indicatorAction>`. */
  indicatorAction: Action<HTMLElement>;
}

/**
 * Create a headless progress bar (WAI-ARIA progressbar pattern). Behaviour and
 * accessibility live in `@design-system/core`; this adapter wires state to a
 * Svelte store and applies the connected props via actions. The element still
 * needs an accessible name, supplied by the consumer (`aria-label`).
 */
export function createProgress(context: core.ProgressContext = {}): CreateProgress {
  const state = writable<ProgressState>(core.initialState(context));

  const setValue = (value: number | null) => {
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
