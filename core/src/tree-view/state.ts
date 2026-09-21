import type { TreeContext, TreeNode, TreeState, VisibleNode } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: TreeContext): TreeState {
  return {
    nodes: context.nodes,
    expanded: context.expanded ?? [],
    selected: context.selected ?? null,
    loading: context.loading ?? [],
    loadErrors: context.loadErrors ?? [],
    focused: null,
    disabled: context.disabled ?? false,
    id: context.id ?? `ds-tree-${++idCounter}`,
  };
}

/**
 * Flatten the forest into the list of currently-visible nodes (collapsed
 * subtrees are excluded), in DOM order, annotating each with the positional
 * metadata the ARIA treeitem needs.
 */
export function visibleNodes(state: TreeState): VisibleNode[] {
  const walk = (nodes: TreeNode[], level: number, parent: string | null): VisibleNode[] => {
    const out: VisibleNode[] = [];
    nodes.forEach((node, index) => {
      const childrenLoaded = node.children !== undefined;
      // An explicit empty array is a completed load with no children. Only an
      // absent array plus hasChildren=true represents a remote parent.
      const hasChildren = childrenLoaded ? node.children!.length > 0 : node.hasChildren === true;
      const expanded = hasChildren && state.expanded.includes(node.value);
      const loadState = childrenLoaded
        ? undefined
        : state.loading.includes(node.value)
          ? "loading"
          : state.loadErrors.includes(node.value)
            ? "error"
            : node.hasChildren
              ? "idle"
              : undefined;
      out.push({
        value: node.value,
        disabled: state.disabled || Boolean(node.disabled),
        level,
        hasChildren,
        childrenLoaded,
        loadState,
        loadStatusId: `${state.id}-load-status-${node.value}`,
        labelId: `${state.id}-label-${node.value}`,
        expanded,
        setSize: nodes.length,
        posInSet: index + 1,
        parent,
      });
      if (expanded && childrenLoaded) out.push(...walk(node.children!, level + 1, node.value));
    });
    return out;
  };
  return walk(state.nodes, 1, null);
}

const enabledOnly = (list: VisibleNode[]) => list.filter((n) => !n.disabled);

/** First visible, enabled node value, or `null`. */
export function firstVisible(state: TreeState): string | null {
  return enabledOnly(visibleNodes(state))[0]?.value ?? null;
}

/** Last visible, enabled node value, or `null`. */
export function lastVisible(state: TreeState): string | null {
  const list = enabledOnly(visibleNodes(state));
  return list[list.length - 1]?.value ?? null;
}

/** Next visible, enabled node after `value` (no wrap), or `null`. */
export function nextVisible(state: TreeState, value: string): string | null {
  const list = enabledOnly(visibleNodes(state));
  const index = list.findIndex((n) => n.value === value);
  return index === -1 ? null : (list[index + 1]?.value ?? null);
}

/** Previous visible, enabled node before `value` (no wrap), or `null`. */
export function prevVisible(state: TreeState, value: string): string | null {
  const list = enabledOnly(visibleNodes(state));
  const index = list.findIndex((n) => n.value === value);
  return index <= 0 ? null : (list[index - 1]?.value ?? null);
}

/** The parent value of `value` among visible nodes, or `null` at the root. */
export function parentOf(state: TreeState, value: string): string | null {
  return visibleNodes(state).find((n) => n.value === value)?.parent ?? null;
}

/** Look up a visible node's descriptor, or `undefined` when hidden/unknown. */
export function visibleNode(state: TreeState, value: string): VisibleNode | undefined {
  return visibleNodes(state).find((n) => n.value === value);
}

/** Compute the next expanded set when a parent is toggled. */
export function toggleExpanded(state: TreeState, value: string): string[] {
  return state.expanded.includes(value)
    ? state.expanded.filter((v) => v !== value)
    : [...state.expanded, value];
}
