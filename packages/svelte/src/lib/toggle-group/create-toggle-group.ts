import { toggleGroup as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type ToggleGroupType = core.ToggleGroupType;
export type ToggleGroupItem = core.ToggleGroupItem;
export type ToggleGroupApi = core.ToggleGroupApi;
export type ToggleGroupState = core.ToggleGroupState;
export type ToggleGroupContext = core.ToggleGroupContext;

export interface CreateToggleGroup {
  /** Reactive resolved state. */
  state: Readable<ToggleGroupState>;
  /** Reactive connected API. */
  api: Readable<ToggleGroupApi>;
  /** The pressed item values. */
  value: Readable<string[]>;
  /** Replace the pressed set. */
  setValue: (value: string[]) => void;
  /** Toggle a single item (ignored when disabled). */
  toggle: (value: string) => void;
  /** Svelte action for the group container: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for a toggle button: `<button use:itemAction={value}>`. */
  itemAction: Action<HTMLElement, string>;
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v) => b.includes(v));

/**
 * Create a headless toggle group: a set of toggle buttons (`aria-pressed`) with
 * roving tabindex and arrow-key movement. Behaviour and accessibility live in
 * `@design-system/core`; this adapter wires state to a Svelte store, applies
 * connected props via actions, and moves DOM focus.
 */
export function createToggleGroup(context: ToggleGroupContext): CreateToggleGroup {
  const state = writable<ToggleGroupState>(core.initialState(context));

  const setValue = (next: string[]) => {
    state.update((current) => {
      if (sameSet(current.value, next)) return current;
      context.onValueChange?.(next);
      return { ...current, value: next };
    });
  };

  // The container scopes focus movement between buttons.
  let rootEl: HTMLElement | null = null;
  const focus = (value: string) => {
    const el = rootEl
      ? Array.from(rootEl.querySelectorAll<HTMLElement>("[data-value]")).find(
          (node) => node.dataset.value === value,
        )
      : null;
    el?.focus();
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setValue, focus, normalize: normalizeProps }),
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

  const itemAction: Action<HTMLElement, string> = (node, value) => {
    const itemApi = derived(api, (a) => a.getItemProps(value as string));
    const handle = createPropsAction(itemApi, (p) => p)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    value: derived(state, ($state) => $state.value),
    setValue,
    toggle: (value: string) => get(api).toggle(value),
    rootAction,
    itemAction,
  };
}
