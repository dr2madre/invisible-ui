import { identityNormalize, type ElementProps, type Normalize } from "../types";
import {
  firstVisible,
  lastVisible,
  nextVisible,
  parentOf,
  prevVisible,
  toggleExpanded,
  visibleNode,
} from "./state";
import type { TreeState } from "./types";

/** The public, framework-agnostic API for a connected tree. */
export interface TreeApi {
  /** Currently expanded parent values. */
  expanded: string[];
  /** The selected value, or `null`. */
  selected: string | null;
  /** Expand/collapse a parent node (ignored for leaves/disabled). */
  toggle(value: string): void;
  /** Select a node (ignored when disabled). */
  select(value: string): void;
  /** Props for the tree container (`role="tree"`). */
  rootProps: ElementProps;
  /** Props for a child-list wrapper (`role="group"`). */
  getGroupProps(): ElementProps;
  /** Props for a treeitem, by value (`role="treeitem"`). */
  getItemProps(value: string): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: TreeState;
  /** Request a new expanded set; the adapter owns how state updates. */
  setExpanded: (expanded: string[]) => void;
  /** Request a new selected value. */
  setSelected: (value: string) => void;
  /** Record the roving-focus node (drives the single tab stop). */
  setFocused: (value: string) => void;
  /** Move DOM focus to the node with the given value (adapter-provided). */
  focus?: (value: string) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect tree state to prop getters following the WAI-ARIA tree pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): a single-select tree
 * with roving tabindex, expand/collapse, and arrow-key navigation over the
 * currently-visible nodes (Right expands/enters, Left collapses/rises to the
 * parent, Up/Down move between visible rows, Home/End jump to the ends).
 */
export function connect({
  state,
  setExpanded,
  setSelected,
  setFocused,
  focus,
  normalize = identityNormalize,
}: ConnectOptions): TreeApi {
  const { expanded, selected, disabled, id } = state;

  const toggle = (value: string) => {
    const node = visibleNode(state, value);
    if (!node || node.disabled || !node.hasChildren) return;
    setExpanded(toggleExpanded(state, value));
  };

  const select = (value: string) => {
    const node = visibleNode(state, value);
    if (!node || node.disabled) return;
    setSelected(value);
  };

  // Move roving focus to `target` (and DOM focus through the adapter).
  const move = (target: string | null) => {
    if (target == null) return;
    setFocused(target);
    focus?.(target);
  };

  // The single tab stop: the focused node, else the selected one, else the
  // first visible enabled node.
  const tabStop = state.focused ?? selected ?? firstVisible(state);

  const onArrowRight = (value: string) => {
    const node = visibleNode(state, value);
    if (!node) return;
    if (node.hasChildren && !node.expanded) {
      toggle(value);
    } else if (node.hasChildren && node.expanded) {
      // Enter the subtree: the next visible node is the first child.
      move(nextVisible(state, value));
    }
  };

  const onArrowLeft = (value: string) => {
    const node = visibleNode(state, value);
    if (!node) return;
    if (node.hasChildren && node.expanded) {
      toggle(value);
    } else {
      move(parentOf(state, value));
    }
  };

  return {
    expanded,
    selected,
    toggle,
    select,
    rootProps: normalize({
      role: "tree",
      "aria-multiselectable": false,
      "data-disabled": disabled ? "" : undefined,
    }),
    getGroupProps: () => normalize({ role: "group" }),
    getItemProps: (value: string) => {
      const node = visibleNode(state, value);
      const itemDisabled = node?.disabled ?? false;
      const isSelected = selected === value;
      return normalize({
        role: "treeitem",
        id: `${id}-item-${value}`,
        "aria-selected": isSelected,
        "aria-expanded": node?.hasChildren ? Boolean(node.expanded) : undefined,
        "aria-level": node?.level,
        "aria-setsize": node?.setSize,
        "aria-posinset": node?.posInSet,
        "aria-disabled": itemDisabled || undefined,
        tabindex: itemDisabled ? undefined : value === tabStop ? 0 : -1,
        "data-state": node?.hasChildren ? (node.expanded ? "open" : "closed") : undefined,
        "data-selected": isSelected ? "" : undefined,
        "data-disabled": itemDisabled ? "" : undefined,
        "data-value": value,
        onClick: () => {
          setFocused(value);
          select(value);
        },
        onFocus: () => setFocused(value),
        onKeyDown: (event: Event) => {
          const key = (event as KeyboardEvent).key;
          switch (key) {
            case "ArrowDown":
              event.preventDefault();
              move(nextVisible(state, value));
              break;
            case "ArrowUp":
              event.preventDefault();
              move(prevVisible(state, value));
              break;
            case "ArrowRight":
              event.preventDefault();
              onArrowRight(value);
              break;
            case "ArrowLeft":
              event.preventDefault();
              onArrowLeft(value);
              break;
            case "Home":
              event.preventDefault();
              move(firstVisible(state));
              break;
            case "End":
              event.preventDefault();
              move(lastVisible(state));
              break;
            case "Enter":
            case " ":
              event.preventDefault();
              select(value);
              break;
          }
        },
      });
    },
  };
}
