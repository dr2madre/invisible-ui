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
  /** Svelte action for the root `<button>`: `<button use:rootAction>`. */
  rootAction: Action<HTMLElement>;
}

/**
 * Create a headless toggle button — a button that is on or off (`aria-pressed`),
 * suitable for toolbars (e.g. Bold/Italic). This is distinct from a switch:
 * use `createSwitch` for a settings-style on/off control. Behaviour and
 * accessibility live in `@design-system/core`.
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
