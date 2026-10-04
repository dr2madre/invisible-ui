import { treeView as core } from "@design-system/core";
import { useCallback, useId, useMemo, useState } from "react";
import { sameList, useControllable } from "../internal/controllable";
import { focusValue, keyedByDirection, type Direction } from "../internal/roving";
import { normalizeProps } from "../normalize";

export type TreeNode = core.TreeNode;
export type TreeLoadRequest = core.TreeLoadRequest;
export type VisibleTreeNode = core.VisibleNode;

export interface UseTreeViewOptions {
  /** The (possibly nested) node forest. */
  nodes: TreeNode[];
  /** Initial (uncontrolled) or current (controlled) expanded parents. */
  expanded?: string[];
  /** Initial (uncontrolled) or current (controlled) selected node. */
  selected?: string | null;
  /** Unloaded parents with an active request. */
  loading?: string[];
  /** Unloaded parents whose latest request failed. */
  loadErrors?: string[];
  disabled?: boolean;
  /** Called whenever the user expands or collapses a parent. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Called whenever the user selects a node. */
  onSelectedChange?: (selected: string) => void;
  /** Requests children from the application; the tree never fetches (ADR 0014). */
  onLoadChildren?: (request: TreeLoadRequest) => void;
}

export interface UseTreeView {
  /** The connected API; spread `rootProps` and `getItemProps`. */
  api: core.TreeApi;
  /** The rows to render, in order: collapsed subtrees are left out. */
  visible: VisibleTreeNode[];
}

const NONE: string[] = [];

/**
 * Connect the headless tree (WAI-ARIA tree pattern) to React: single
 * selection, expand and collapse, one roving tab stop and arrow-key
 * navigation over the visible rows. In right-to-left text Left Arrow expands
 * and Right Arrow collapses, so the arrow that points inward still opens.
 *
 * `expanded`, `selected`, `loading` and `loadErrors` are controllable mirrors
 * (ADR 0011). Expanding a parent marked `hasChildren` with no `children` asks
 * for them through `onLoadChildren` and marks it loading until the
 * application answers with new `nodes` and `loading` (ADR 0014). Spread
 * `rootProps` on the tree: it carries the id the arrow keys look for the rows
 * under.
 */
export function useTreeView({
  nodes,
  expanded: expandedProp = NONE,
  selected: selectedProp = null,
  loading: loadingProp = NONE,
  loadErrors: loadErrorsProp = NONE,
  disabled = false,
  onExpandedChange,
  onSelectedChange,
  onLoadChildren,
}: UseTreeViewOptions): UseTreeView {
  const id = `ds-tree-${useId()}`;
  const [expanded, setExpanded] = useControllable(expandedProp, onExpandedChange, sameList);
  const [selected, setSelected] = useControllable<string | null>(
    selectedProp,
    onSelectedChange as ((value: string | null) => void) | undefined,
  );
  // Every list the application hands over is applied, even one with the same
  // entries: it is the answer to a request the tree marked loading itself.
  const [loading, setLoading] = useControllable(loadingProp, undefined);
  const [loadErrors, setLoadErrors] = useControllable(loadErrorsProp, undefined);
  const [focused, setFocused] = useState<string | null>(null);

  // The request is marked loading here, so a second press cannot repeat it
  // before the application reflects it.
  const requestLoad = useCallback(
    (request: TreeLoadRequest) => {
      if (loading.includes(request.value)) return;
      setLoading([...loading, request.value]);
      setLoadErrors(loadErrors.filter((value) => value !== request.value));
      onLoadChildren?.(request);
    },
    [loading, loadErrors, setLoading, setLoadErrors, onLoadChildren],
  );

  const state = useMemo<core.TreeState>(
    () => ({ nodes, expanded, selected, loading, loadErrors, focused, disabled, id }),
    [nodes, expanded, selected, loading, loadErrors, focused, disabled, id],
  );

  const connect = useCallback(
    (direction: Direction) =>
      core.connect({
        state,
        setExpanded,
        setSelected,
        setFocused,
        focus: (target) => focusValue(document.getElementById(id), target),
        requestLoad,
        direction,
        normalize: normalizeProps,
      }),
    [state, id, setExpanded, setSelected, requestLoad],
  );

  const api = useMemo(() => {
    const ltr = connect("ltr");
    return {
      ...ltr,
      // The rows live inside the element that carries this id.
      rootProps: { ...ltr.rootProps, id },
      getItemProps: (value: string) =>
        keyedByDirection(ltr.getItemProps(value), () => connect("rtl").getItemProps(value)),
    };
  }, [connect, id]);

  const visible = useMemo(() => core.visibleNodes(state), [state]);
  return { api, visible };
}
