import { treeView as core } from "@invisible-ui/core";
import {
  computed,
  onScopeDispose,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type TreeNode = core.TreeNode;
export type TreeApi = core.TreeApi;
export type TreeState = core.TreeState;
export type TreeLoadRequest = core.TreeLoadRequest;
export type VisibleNode = core.VisibleNode;

export interface UseTreeViewOptions {
  /** The (possibly nested) node forest. */
  nodes: TreeNode[];
  /** Expanded parent values (controlled). */
  expanded?: string[];
  /** Selected value (controlled), or `null`. */
  selected?: string | null;
  /** Unloaded parent values with an active request. */
  loading?: string[];
  /** Unloaded parent values whose latest request failed. */
  loadErrors?: string[];
  disabled?: boolean;
  /** Called whenever the expanded set changes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Called whenever the selected value changes. */
  onSelectedChange?: (selected: string) => void;
  /** Requests children from the application; the component never fetches. */
  onLoadChildren?: (request: TreeLoadRequest) => void;
  /** Typeahead text for a node whose row shows no label text; defaults to its value. */
  labelOf?: (value: string) => string;
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
 * roving tabindex, expand/collapse, arrow-key navigation over the visible
 * nodes (mirrored in right-to-left text) and typeahead, which moves focus
 * only.The flattening and navigation logic lives in `@invisible-ui/core`;
 * this composable owns the resolved state (mirroring controlled `expanded` /
 * `selected` with watches), derives the connected props with
 * `computed(connect)`, and moves DOM focus inside the tree (`rootRef`).
 */
export function useTreeView(options: MaybeRefOrGetter<UseTreeViewOptions>): UseTreeView {
  const resolved = computed(() => toValue(options));
  // One seeding pass fixes the id, so later states reuse it instead of drawing
  // a fresh one from the core's counter on every recompute.
  const seed = core.initialState({ ...resolved.value, id: useStableId("ds-tree") });
  const expanded = ref<string[]>(seed.expanded);
  const selected = ref<string | null>(seed.selected);
  const focused = ref<string | null>(null);
  const loading = ref<string[]>(seed.loading);
  const loadErrors = ref<string[]>(seed.loadErrors);

  watch(
    () => resolved.value.expanded,
    (next) => {
      if (next) expanded.value = next;
    },
  );

  watch(
    () => resolved.value.loading,
    (next) => {
      if (next) loading.value = next;
    },
  );

  watch(
    () => resolved.value.loadErrors,
    (next) => {
      if (next) loadErrors.value = next;
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

  const requestLoad = (request: TreeLoadRequest) => {
    if (loading.value.includes(request.value)) return;
    loading.value = [...loading.value, request.value];
    loadErrors.value = loadErrors.value.filter((value) => value !== request.value);
    resolved.value.onLoadChildren?.(request);
  };

  const state = computed<TreeState>(() => ({
    nodes: resolved.value.nodes,
    expanded: expanded.value,
    selected: selected.value,
    loading: loading.value,
    loadErrors: loadErrors.value,
    focused: focused.value,
    disabled: resolved.value.disabled ?? false,
    id: seed.id,
  }));

  // One query per tree, so characters typed in quick succession add up.
  const typeahead = core.createTypeahead();
  onScopeDispose(() => typeahead.reset());

  // Typeahead matches the text a row shows, which the label slot may change.
  const visible = computed(() => core.visibleNodes(state.value));
  const labelIds = computed(() => new Map(visible.value.map((node) => [node.value, node.labelId])));
  const labelOf = (value: string) => {
    const labelId = labelIds.value.get(value);
    const text = labelId ? document.getElementById(labelId)?.textContent?.trim() : undefined;
    return text || resolved.value.labelOf?.(value) || value;
  };

  const connectIn = (direction: "ltr" | "rtl") =>
    core.connect({
      state: state.value,
      setExpanded,
      setSelected,
      setFocused,
      focus,
      requestLoad,
      direction,
      typeahead,
      labelOf,
      normalize: normalizeProps,
    });

  // The reading direction is read when a key arrives, so a `dir` set by an
  // ancestor after render still mirrors Left and Right.
  const api = computed<TreeApi>(() => {
    const ltr = connectIn("ltr");
    return {
      ...ltr,
      getItemProps: (value: string) => {
        const props = ltr.getItemProps(value);
        const onKeydown = props.onKeydown as ((event: KeyboardEvent) => void) | undefined;
        if (!onKeydown) return props;
        return {
          ...props,
          onKeydown: (event: KeyboardEvent) => {
            const root = rootRef.value;
            if (root && getComputedStyle(root).direction === "rtl") {
              (connectIn("rtl").getItemProps(value).onKeydown as typeof onKeydown)(event);
            } else onKeydown(event);
          },
        };
      },
    };
  });

  return {
    api,
    visible,
    expanded: computed(() => expanded.value),
    selected: computed(() => selected.value),
    rootRef,
  };
}
