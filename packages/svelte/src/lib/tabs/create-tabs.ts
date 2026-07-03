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
  /** Sync an externally-controlled value without emitting a change event. */
  syncValue: (value: string | null) => void;
  /** Replace the tab list (e.g. when items change). */
  setItems: (items: TabItem[]) => void;
  /** Sync the activation mode. */
  setActivationMode: (activationMode: ActivationMode) => void;
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

  const updateValue = (value: string | null, notify: boolean) => {
    state.update((current) => {
      if (current.value === value) return current;
      if (notify && value != null) context.onValueChange?.(value);
      return { ...current, value };
    });
  };

  const setValue = (value: string) => updateValue(value, true);
  const syncValue = (value: string | null) =>
    state.update((current) => {
      const next = value ?? core.firstEnabled(current.items);
      return current.value === next ? current : { ...current, value: next };
    });

  const setItems = (items: TabItem[]) =>
    state.update((current) => {
      const hasCurrent = current.value && items.some((item) => item.value === current.value);
      const nextValue = hasCurrent ? current.value : core.firstEnabled(items);
      return { ...current, items, value: nextValue };
    });

  const setActivationMode = (activationMode: ActivationMode) =>
    state.update((current) =>
      current.activationMode === activationMode ? current : { ...current, activationMode },
    );

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
    syncValue,
    setItems,
    setActivationMode,
    rootAction,
    tabAction,
    panelAction,
  };
}
