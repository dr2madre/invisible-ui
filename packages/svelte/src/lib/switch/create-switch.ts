import { switchControl as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createRootAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type SwitchApi = core.SwitchApi;
export type SwitchState = core.SwitchState;
export type SwitchContext = core.SwitchContext;

export interface CreateSwitch {
  /** Reactive resolved state (`{ checked, disabled }`). */
  state: Readable<SwitchState>;
  /** Reactive connected API (prop getters + helpers). */
  api: Readable<SwitchApi>;
  /** Imperatively set the checked value (ignored when disabled). */
  setChecked: (value: boolean) => void;
  /** Imperatively flip the checked value (ignored when disabled). */
  toggle: () => void;
  /** Svelte action for the root `<button>`: `<button use:rootAction>`. */
  rootAction: Action<HTMLElement>;
}

/**
 * Create a headless switch (WAI-ARIA switch pattern: role="switch" +
 * aria-checked). Behaves like a toggle, but screen readers announce on/off —
 * preferable for settings. Behaviour and accessibility live in
 * `@design-system/core`.
 */
export function createSwitch(context: SwitchContext = {}): CreateSwitch {
  const state = writable<SwitchState>(core.initialState(context));

  const setChecked = (value: boolean) => {
    state.update((current) => {
      if (current.disabled || current.checked === value) return current;
      context.onCheckedChange?.(value);
      return { ...current, checked: value };
    });
  };

  const toggle = () => setChecked(!get(state).checked);

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setChecked, normalize: normalizeProps }),
  );

  return { state, api, setChecked, toggle, rootAction: createRootAction(api) };
}
