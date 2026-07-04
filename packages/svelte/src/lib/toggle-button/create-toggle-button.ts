import { toggleButton as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createRootAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type ToggleButtonApi = core.ToggleButtonApi;
export type ToggleButtonState = core.ToggleButtonState;
export type ToggleButtonContext = core.ToggleButtonContext;

export interface CreateToggleButton {
  /** Reactive resolved state (`{ pressed, disabled }`). */
  state: Readable<ToggleButtonState>;
  /** Reactive connected API (prop getters + helpers). */
  api: Readable<ToggleButtonApi>;
  /** Imperatively set the pressed value (ignored when disabled). */
  setPressed: (value: boolean) => void;
  /** Imperatively flip the pressed value (ignored when disabled). */
  toggle: () => void;
  /** Svelte action for the native checkbox: `<input type="checkbox" use:rootAction>`. */
  rootAction: Action<HTMLElement>;
}

/**
 * Create a headless toggle button — an independent on/off control rendered as a
 * native `<input type="checkbox">` styled to look like a button (e.g. Bold in a
 * toolbar). This is distinct from a switch (a settings-style on/off control):
 * use `createSwitch` for that. Behaviour and accessibility live in
 * `@design-system/core`; the browser owns the checkbox role, Space activation,
 * focus and form participation.
 */
export function createToggleButton(context: ToggleButtonContext = {}): CreateToggleButton {
  const state = writable<ToggleButtonState>(core.initialState(context));

  const setPressed = (value: boolean) => {
    state.update((current) => {
      if (current.disabled || current.pressed === value) return current;
      context.onPressedChange?.(value);
      return { ...current, pressed: value };
    });
  };

  const toggle = () => setPressed(!get(state).pressed);

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setPressed, normalize: normalizeProps }),
  );

  return { state, api, setPressed, toggle, rootAction: createRootAction(api) };
}
