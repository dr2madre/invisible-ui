import { treeView as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type TreeNode = core.TreeNode;
export type TreeApi = core.TreeApi;
export type TreeState = core.TreeState;
export type TreeContext = core.TreeContext;
export type TreeLoadRequest = core.TreeLoadRequest;
export type VisibleNode = core.VisibleNode;

export interface CreateTreeView {
  /** Reactive resolved state. */
  state: Readable<TreeState>;
  /** Reactive connected API. */
  api: Readable<TreeApi>;
  /** The currently-visible, flattened node list (for rendering). */
  visible: Readable<VisibleNode[]>;
  /** Expanded parent values. */
  expanded: Readable<string[]>;
  /** The selected value (or `null`). */
  selected: Readable<string | null>;
  /** Unloaded parents with an active request. */
  loading: Readable<string[]>;
  /** Unloaded parents whose latest request failed. */
  loadErrors: Readable<string[]>;
  /** Reflect controlled nodes without reporting a change. */
  syncNodes: (nodes: TreeNode[]) => void;
  /** Reflect the controlled disabled state. */
  syncDisabled: (disabled: boolean) => void;
  /** Reflect a controlled `expanded` prop without reporting a change. */
  syncExpanded: (expanded: string[]) => void;
  /** Reflect a controlled `selected` prop without reporting a change. */
  syncSelected: (value: string | null) => void;
  /** Reflect controlled loading values without reporting a request. */
  syncLoading: (loading: string[]) => void;
  /** Reflect controlled failures without reporting a request. */
  syncLoadErrors: (loadErrors: string[]) => void;
  /** Imperatively expand/collapse a parent. */
  toggle: (value: string) => void;
  /** Imperatively select a value. */
  select: (value: string) => void;
  /** Svelte action for the tree container: `<div use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for a treeitem: `<div use:itemAction={value}>`. */
  itemAction: Action<HTMLElement, string>;
}

/**
 * Create a headless tree (WAI-ARIA tree pattern): single selection, roving
 * tabindex, expand/collapse and arrow-key navigation over the visible nodes.
 * The flattening + navigation logic lives in `@design-system/core`; this adapter
 * wires state to Svelte stores, applies the connected props via actions, and
 * moves DOM focus during navigation.
 */
export function createTreeView(context: TreeContext): CreateTreeView {
  const state = writable<TreeState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-tree") }),
  );

  const setExpanded = (expanded: string[]) => {
    const current = get(state);
    state.set({ ...current, expanded });
    context.onExpandedChange?.(expanded);
  };

  const setSelected = (value: string) => {
    const current = get(state);
    if (current.selected === value) return;
    state.set({ ...current, selected: value });
    context.onSelectedChange?.(value);
  };

  const sameValues = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((entry, index) => entry === b[index]);

  // Reflect controlled props without reporting a change.
  const syncExpanded = (expanded: string[]) =>
    state.update((current) =>
      sameValues(current.expanded, expanded) ? current : { ...current, expanded },
    );

  const syncSelected = (value: string | null) =>
    state.update((current) =>
      current.selected === value ? current : { ...current, selected: value },
    );

  const syncNodes = (nodes: TreeNode[]) =>
    state.update((current) => (current.nodes === nodes ? current : { ...current, nodes }));

  const syncDisabled = (disabled: boolean) =>
    state.update((current) => (current.disabled === disabled ? current : { ...current, disabled }));

  const syncLoading = (loading: string[]) =>
    state.update((current) =>
      sameValues(current.loading, loading) ? current : { ...current, loading },
    );

  const syncLoadErrors = (loadErrors: string[]) =>
    state.update((current) =>
      sameValues(current.loadErrors, loadErrors) ? current : { ...current, loadErrors },
    );

  const setFocused = (value: string) => {
    state.update((current) =>
      current.focused === value ? current : { ...current, focused: value },
    );
  };

  // The root element scopes focus movement during keyboard navigation.
  let rootEl: HTMLElement | null = null;
  const focus = (value: string) => {
    const el = rootEl
      ? Array.from(rootEl.querySelectorAll<HTMLElement>("[data-value]")).find(
          (node) => node.dataset.value === value,
        )
      : null;
    el?.focus();
  };

  const requestLoad = (request: TreeLoadRequest) => {
    const current = get(state);
    if (current.loading.includes(request.value)) return;
    state.set({
      ...current,
      loading: [...current.loading, request.value],
      loadErrors: current.loadErrors.filter((value) => value !== request.value),
    });
    context.onLoadChildren?.(request);
  };

  const api = derived(state, ($state) =>
    core.connect({
      state: $state,
      setExpanded,
      setSelected,
      setFocused,
      focus,
      requestLoad,
      normalize: normalizeProps,
    }),
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
    const handle = createPropsAction(itemApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    visible: derived(state, ($state) => core.visibleNodes($state)),
    expanded: derived(state, ($state) => $state.expanded),
    selected: derived(state, ($state) => $state.selected),
    loading: derived(state, ($state) => $state.loading),
    loadErrors: derived(state, ($state) => $state.loadErrors),
    syncNodes,
    syncDisabled,
    syncExpanded,
    syncSelected,
    syncLoading,
    syncLoadErrors,
    // Imperative helpers read the connected API's current value.
    toggle: (value: string) => get(api).toggle(value),
    select: (value: string) => get(api).select(value),
    rootAction,
    itemAction,
  };
}
