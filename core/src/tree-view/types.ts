/** A node in a tree. Nodes with `children` are parents (expandable). */
export interface TreeNode {
  value: string;
  disabled?: boolean;
  children?: TreeNode[];
}

/** Internal, fully-resolved state of a tree. */
export interface TreeState {
  /** The (possibly nested) node forest. */
  nodes: TreeNode[];
  /** Values of the currently expanded parent nodes. */
  expanded: string[];
  /** The selected node value, or `null`. Single-select. */
  selected: string | null;
  /** The roving-focus node value, or `null` (defaults to selected / first). */
  focused: string | null;
  /** Whether the whole tree is disabled. */
  disabled: boolean;
  /** Base id used to scope generated ids. */
  id: string;
}

/** User-provided options when creating a tree. */
export interface TreeContext {
  /** The (possibly nested) node forest. */
  nodes: TreeNode[];
  /** Initially expanded parent values. Defaults to none. */
  expanded?: string[];
  /** Initially selected value. Defaults to none. */
  selected?: string | null;
  /** Whether the whole tree is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Base id used to scope generated ids. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the expanded set changes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Called whenever the selected value changes. */
  onSelectedChange?: (selected: string) => void;
}

/**
 * A node as it appears in the flattened, currently-visible list (collapsed
 * subtrees are excluded). Carries the positional metadata the ARIA treeitem
 * needs (`aria-level`, `aria-setsize`, `aria-posinset`).
 */
export interface VisibleNode {
  value: string;
  disabled: boolean;
  /** 1-based depth, for `aria-level`. */
  level: number;
  /** Whether the node has children (is expandable). */
  hasChildren: boolean;
  /** Whether the node is currently expanded. */
  expanded: boolean;
  /** Number of siblings (incl. self), for `aria-setsize`. */
  setSize: number;
  /** 1-based position among siblings, for `aria-posinset`. */
  posInSet: number;
  /** The parent node's value, or `null` at the root. */
  parent: string | null;
}
