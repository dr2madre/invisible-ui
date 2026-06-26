import { checkboxGroup as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type CheckboxGroupItem = core.CheckboxGroupItem;
export type CheckboxGroupApi = core.CheckboxGroupApi;
export type CheckboxGroupState = core.CheckboxGroupState;
export type CheckboxGroupContext = core.CheckboxGroupContext;

export interface CreateCheckboxGroup {
  /** Reactive resolved state. */
  state: Readable<CheckboxGroupState>;
  /** Reactive connected API. */
  api: Readable<CheckboxGroupApi>;
  /** The selected values. */
  value: Readable<string[]>;
  /** Imperatively replace the selection. */
  setValue: (value: string[]) => void;
  /** Svelte action for the group container: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for a single item: `<span use:itemAction={value}>`. */
  itemAction: Action<HTMLElement, string>;
}

/**
 * Create a headless multi-select checkbox group (WAI-ARIA `role="group"` of
 * `role="checkbox"` items). Behaviour and accessibility live in
 * `@design-system/core`; this adapter wires state to a Svelte store and applies
 * the connected props via actions. Each item is independently Tab-focusable and
 * toggled with Space — no roving tabindex, so no focus management is needed.
 */
export function createCheckboxGroup(context: CheckboxGroupContext): CreateCheckboxGroup {
  const state = writable<CheckboxGroupState>(core.initialState(context));

  const setValue = (value: string[]) => {
    state.update((current) => {
      context.onValueChange?.(value);
      return { ...current, value };
    });
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setValue, normalize: normalizeProps }),
  );

  const rootAction = createPropsAction(api, (a) => a.rootProps);

  const itemAction: Action<HTMLElement, string> = (node, value) => {
    const itemApi = derived(api, (a) => a.getItemProps(value as string));
    const handle = createPropsAction(itemApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    value: derived(state, ($state) => $state.value),
    setValue,
    rootAction,
    itemAction,
  };
}
