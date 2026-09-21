/** A node in a tree. */
export interface TreeNode {
  value: string;
  disabled?: boolean;
  /**
   * Marks a parent whose children are not loaded yet. Omit `children` until
   * they arrive; `children: []` always means a loaded leaf.
   */
  hasChildren?: boolean;
  children?: TreeNode[];
}

/** One application-owned request for the children of an unloaded parent. */
export interface TreeLoadRequest {
  value: string;
  /** Monotonically increasing token used to reject an out-of-order response. */
  requestId: number;
}

/** Internal, fully-resolved state of a tree. */
export interface TreeState {
  /** The (possibly nested) node forest. */
  nodes: TreeNode[];
  /** Values of the currently expanded parent nodes. */
  expanded: string[];
  /** The selected node value, or `null`. Single-select. */
  selected: string | null;
  /** Unloaded parent values with an active request. */
  loading: string[];
  /** Unloaded parent values whose latest request failed. */
  loadErrors: string[];
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
  /** Unloaded parent values with an active request. */
  loading?: string[];
  /** Unloaded parent values whose latest request failed. */
  loadErrors?: string[];
  /** Whether the whole tree is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Base id used to scope generated ids. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the expanded set changes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Called whenever the selected value changes. */
  onSelectedChange?: (selected: string) => void;
  /** Requests children from the application. The design system never fetches. */
  onLoadChildren?: (request: TreeLoadRequest) => void;
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
  /** Whether the children array has been supplied by the consumer. */
  childrenLoaded: boolean;
  /** State of an unloaded parent. Absent for loaded parents and leaves. */
  loadState?: "idle" | "loading" | "error";
  /** Stable id of the loading or failure description for this treeitem. */
  loadStatusId: string;
  /** Stable id of the label that supplies this treeitem's accessible name. */
  labelId: string;
  /** Whether the node is currently expanded. */
  expanded: boolean;
  /** Number of siblings (incl. self), for `aria-setsize`. */
  setSize: number;
  /** 1-based position among siblings, for `aria-posinset`. */
  posInSet: number;
  /** The parent node's value, or `null` at the root. */
  parent: string | null;
}
