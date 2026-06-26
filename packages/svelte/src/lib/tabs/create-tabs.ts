import { tabs as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type ActivationMode = core.ActivationMode;
export type TabItem = core.TabItem;
export type TabsApi = core.TabsApi;
export type TabsState = core.TabsState;
export type TabsContext = core.TabsContext;

export interface CreateTabs {
  /** Reactive resolved state. */
  state: Readable<TabsState>;
  /** Reactive connected API. */
  api: Readable<TabsApi>;
  /** The selected tab value (or `null`). */
  value: Readable<string | null>;
  /** Imperatively select a tab (ignored when disabled). */
  setValue: (value: string) => void;
  /** Svelte action for the tab list container: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for a tab trigger: `<button use:tabAction={value}>`. */
  tabAction: Action<HTMLElement, string>;
  /** Svelte action for a tab panel: `<div use:panelAction={value}>`. */
  panelAction: Action<HTMLElement, string>;
}

/**
 * Create a headless tabs widget (WAI-ARIA tabs pattern) with roving tabindex,
 * arrow/Home/End navigation, and automatic or manual activation. Behaviour and
 * accessibility live in `@design-system/core`; this adapter wires state to a
 * Svelte store, applies connected props via actions, and moves DOM focus.
 */
export function createTabs(context: TabsContext): CreateTabs {
  const state = writable<TabsState>(core.initialState(context));

  const setValue = (value: string) => {
    state.update((current) => {
      if (current.value === value) return current;
      context.onValueChange?.(value);
      return { ...current, value };
    });
  };

  // The tab list scopes focus movement during keyboard navigation.
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

  const tabAction: Action<HTMLElement, string> = (node, value) => {
    const tabApi = derived(api, (a) => a.getTabProps(value as string));
    const handle = createPropsAction(tabApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  const panelAction: Action<HTMLElement, string> = (node, value) => {
    const panelApi = derived(api, (a) => a.getPanelProps(value as string));
    const handle = createPropsAction(panelApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    value: derived(state, ($state) => $state.value),
    setValue,
    rootAction,
    tabAction,
    panelAction,
  };
}
