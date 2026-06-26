import { pinInput as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type PinInputType = core.PinInputType;
export type PinInputApi = core.PinInputApi;
export type PinInputState = core.PinInputState;
export type PinInputContext = core.PinInputContext;

export interface CreatePinInput {
  /** Reactive resolved state. */
  state: Readable<PinInputState>;
  /** Reactive connected API. */
  api: Readable<PinInputApi>;
  /** Per-cell values. */
  values: Readable<string[]>;
  /** The combined value. */
  value: Readable<string>;
  /** Replace the per-cell values. */
  setValues: (values: string[]) => void;
  /** Svelte action for the group container: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for a cell input: `<input use:inputAction={index}>`. */
  inputAction: Action<HTMLElement, number>;
}

/**
 * Create a headless PIN input (OTP / verification code). Behaviour and
 * accessibility (per-cell entry, advance/backspace, arrows, paste distribution,
 * character filtering) live in `@design-system/core`; this adapter wires state
 * to a Svelte store, applies connected props via actions, moves DOM focus, and
 * fires `onComplete` once every cell is filled.
 */
export function createPinInput(context: core.PinInputContext = {}): CreatePinInput {
  const state = writable<PinInputState>(core.initialState(context));

  const setValues = (values: string[]) => {
    state.update((current) => {
      const next = { ...current, values };
      const value = values.join("");
      context.onValueChange?.(value);
      if (core.isComplete(next)) context.onComplete?.(value);
      return next;
    });
  };

  let rootEl: HTMLElement | null = null;
  const focus = (index: number) => {
    const el = rootEl
      ? Array.from(rootEl.querySelectorAll<HTMLElement>("[data-index]")).find(
          (node) => node.dataset.index === String(index),
        )
      : null;
    el?.focus();
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setValues, focus, normalize: normalizeProps }),
  );

  const baseRootAction = createPropsAction(api, (a) => a.rootProps);
  const rootAction: Action<HTMLElement> = (node) => {
    rootEl = node;
    const handle = baseRootAction(node);
    return {
      destroy() {
        if (rootEl === node) rootEl = null;
        handle?.destroy?.();
      },
    };
  };

  const inputAction: Action<HTMLElement, number> = (node, index) => {
    const inputApi = derived(api, (a) => a.getInputProps(index as number));
    const handle = createPropsAction(inputApi, (p) => p)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    values: derived(state, ($state) => $state.values),
    value: derived(state, ($state) => $state.values.join("")),
    setValues,
    rootAction,
    inputAction,
  };
}
