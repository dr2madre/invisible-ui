import { treeView as core } from "@design-system/core";
import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { normalizeProps } from "../normalize";

export type TreeNode = core.TreeNode;
export type TreeApi = core.TreeApi;
export type TreeState = core.TreeState;
export type VisibleNode = core.VisibleNode;

export interface UseTreeViewOptions {
  /** The (possibly nested) node forest. */
  nodes: TreeNode[];
  /** Expanded parent values (controlled). */
  expanded?: string[];
  /** Selected value (controlled), or `null`. */
  selected?: string | null;
  disabled?: boolean;
  /** Called whenever the expanded set changes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Called whenever the selected value changes. */
  onSelectedChange?: (selected: string) => void;
}

export interface UseTreeView {
  /** Reactive connected API; spread `rootProps` and `getItemProps`. */
  api: ComputedRef<TreeApi>;
  /** The currently-visible, flattened node list (for rendering). */
  visible: ComputedRef<VisibleNode[]>;
  /** Expanded parent values. */
  expanded: ComputedRef<string[]>;
  /** The selected value, or `null`. */
  selected: ComputedRef<string | null>;
  /** Template ref for the tree container; scopes focus movement during navigation. */
  rootRef: Ref<HTMLElement | null>;
}

/**
 * Connect the headless tree (WAI-ARIA tree pattern) to Vue: single selection,
 * roving tabindex, expand/collapse and arrow-key navigation over the visible
 * nodes. The flattening and navigation logic lives in `@design-system/core`;
 * this composable owns the resolved state (mirroring controlled `expanded` /
 * `selected` with watches), derives the connected props with
 * `computed(connect)`, and moves DOM focus inside the tree (`rootRef`).
 */
export function useTreeView(options: MaybeRefOrGetter<UseTreeViewOptions>): UseTreeView {
  const resolved = computed(() => toValue(options));
  // One seeding pass fixes the id, so later states reuse it instead of drawing
  // a fresh one from the core's counter on every recompute.
  const seed = core.initialState(resolved.value);
  const expanded = ref<string[]>(seed.expanded);
  const selected = ref<string | null>(seed.selected);
  const focused = ref<string | null>(null);

  watch(
    () => resolved.value.expanded,
    (next) => {
      if (next) expanded.value = next;
    },
  );

  watch(
    () => resolved.value.selected,
    (next) => {
      if (next !== undefined) selected.value = next;
    },
  );

  const setExpanded = (next: string[]) => {
    expanded.value = next;
    resolved.value.onExpandedChange?.(next);
  };

  const setSelected = (value: string) => {
    if (selected.value === value) return;
    selected.value = value;
    resolved.value.onSelectedChange?.(value);
  };

  const setFocused = (value: string) => {
    focused.value = value;
  };

  const rootRef = ref<HTMLElement | null>(null);
  const focus = (value: string) => {
    const el = rootRef.value
      ? Array.from(rootRef.value.querySelectorAll<HTMLElement>("[data-value]")).find(
          (node) => node.dataset.value === value,
        )
      : null;
    el?.focus();
  };

  const state = computed<TreeState>(() => ({
    nodes: resolved.value.nodes,
    expanded: expanded.value,
    selected: selected.value,
    focused: focused.value,
    disabled: resolved.value.disabled ?? false,
    id: seed.id,
  }));

  const api = computed(() =>
    core.connect({
      state: state.value,
      setExpanded,
      setSelected,
      setFocused,
      focus,
      normalize: normalizeProps,
    }),
  );

  return {
    api,
    visible: computed(() => core.visibleNodes(state.value)),
    expanded: computed(() => expanded.value),
    selected: computed(() => selected.value),
    rootRef,
  };
}
