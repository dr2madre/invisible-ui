import { checkbox as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createRootAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type CheckedState = core.CheckedState;
export type CheckboxApi = core.CheckboxApi;
export type CheckboxState = core.CheckboxState;
export type CheckboxContext = core.CheckboxContext;

export interface CreateCheckbox {
  /** Reactive resolved state (`{ checked, disabled }`). */
  state: Readable<CheckboxState>;
  /** Reactive connected API (prop getters + helpers). */
  api: Readable<CheckboxApi>;
  /** Imperatively set the checked value (ignored when disabled). */
  setChecked: (value: CheckedState) => void;
  /** Imperatively advance the checked value (ignored when disabled). */
  toggle: () => void;
  /** Svelte action for the root element: `<span use:rootAction>`. */
  rootAction: Action<HTMLElement>;
}

/**
 * Create a headless checkbox supporting checked / unchecked / indeterminate.
 * Behaviour and accessibility live in `@design-system/core`; this adapter
 * wires the state to a Svelte store and applies the connected props via an
 * action.
 */
export function createCheckbox(context: CheckboxContext = {}): CreateCheckbox {
  const state = writable<CheckboxState>(core.initialState(context));

  const setChecked = (value: CheckedState) => {
    state.update((current) => {
      if (current.disabled || current.checked === value) return current;
      context.onCheckedChange?.(value);
      return { ...current, checked: value };
    });
  };

  const toggle = () => setChecked(get(state).checked === true ? false : true);

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setChecked, normalize: normalizeProps }),
  );

  return { state, api, setChecked, toggle, rootAction: createRootAction(api) };
}
