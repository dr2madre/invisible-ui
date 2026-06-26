<script lang="ts">
  /**
   * TreeView — the styled, batteries-included tree (WAI-ARIA tree pattern):
   * single selection, expand/collapse, roving tabindex and full arrow-key
   * navigation. Behaviour and accessibility come from the headless tree in
   * `@design-system/core`.
   *
   * Pass a (possibly nested) `nodes` forest. Each node renders a row; parents get
   * a disclosure twistie. Labels default to the node `value`; override per node
   * via the `label` slot (`let:node`) or a `labels` map.
   *
   * The tree is rendered as a flat list of `treeitem`s carrying `aria-level`,
   * `aria-setsize` and `aria-posinset` (a valid alternative to nested `group`s),
   * which keeps the DOM order aligned with keyboard navigation. The control needs
   * an accessible name via `label`. Colors are themeable (`--ds-tree-*`).
   */
  import { createTreeView, type TreeContext, type TreeNode } from "./create-tree-view";

  export let nodes: TreeNode[];
  export let expanded: string[] = [];
  export let selected: string | null = null;
  export let disabled = false;
  /** Accessible name for the tree (announced by screen readers). */
  export let label: string;
  /** Optional per-node display labels, keyed by node value. */
  export let labels: Record<string, string> | undefined = undefined;
  /** Called whenever the expanded set changes. */
  export let onExpandedChange: ((expanded: string[]) => void) | undefined = undefined;
  /** Called whenever the selected value changes. */
  export let onSelectedChange: ((selected: string) => void) | undefined = undefined;

  const context: TreeContext = {
    nodes,
    expanded,
    selected,
    disabled,
    onExpandedChange,
    onSelectedChange,
  };

  const tree = createTreeView(context);
  const {
    rootAction,
    itemAction,
    visible,
    expanded: expandedStore,
    selected: selectedStore,
  } = tree;
</script>

<ul class="tree" use:rootAction aria-label={label}>
  {#each $visible as node (node.value)}
    {@const isSelected = $selectedStore === node.value}
    {@const isExpanded = $expandedStore.includes(node.value)}
    <li
      class="tree__item"
      class:tree__item--selected={isSelected}
      style="--ds-tree-level: {node.level}"
      use:itemAction={node.value}
    >
      {#if node.hasChildren}
        <button
          type="button"
          class="tree__twistie"
          class:tree__twistie--open={isExpanded}
          tabindex="-1"
          aria-hidden="true"
          on:click|stopPropagation={() => tree.toggle(node.value)}
        >
          <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
            <path
              d="M6 4l4 4-4 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      {:else}
        <span class="tree__twistie-spacer" aria-hidden="true"></span>
      {/if}
      <span class="tree__label">
        <slot name="label" {node}>{labels?.[node.value] ?? node.value}</slot>
      </span>
    </li>
  {/each}
</ul>

<style>
  .tree {
    margin: 0;
    padding: var(--ds-tree-padding, 0.25rem);
    list-style: none;
    font: inherit;
    color: var(--ds-color-text, #0f172a);
    background: var(--ds-tree-bg, transparent);
    border-radius: var(--ds-tree-radius, var(--ds-radius-surface, 0.5rem));
  }

  .tree__item {
    display: flex;
    align-items: center;
    gap: var(--ds-tree-gap, 0.35rem);
    /* Indent by depth; level is 1-based. */
    padding-block: var(--ds-tree-item-padding-block, 0.3rem);
    padding-inline-end: 0.5rem;
    padding-inline-start: calc(
      0.4rem + (var(--ds-tree-level, 1) - 1) * var(--ds-tree-indent, 1.1rem)
    );
    border-radius: var(--ds-tree-item-radius, var(--ds-radius-control, 0.375rem));
    cursor: pointer;
    user-select: none;
  }
  .tree__item:hover {
    background: var(--ds-tree-item-hover, var(--ds-color-neutral-surface, #f1f5f9));
  }
  .tree__item--selected {
    background: var(--ds-tree-item-selected-bg, var(--ds-color-primary, #2563eb));
    color: var(--ds-tree-item-selected-text, var(--ds-color-on-primary, #fff));
  }
  .tree__item--selected:hover {
    background: var(--ds-tree-item-selected-bg, var(--ds-color-primary, #2563eb));
  }
  .tree__item:global(:focus-visible) {
    outline: var(--ds-focus-ring-width, 2px) solid var(--ds-color-focus-ring, currentColor);
    outline-offset: -2px;
  }
  .tree__item:global([aria-disabled="true"]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tree__twistie {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    inline-size: 1.1em;
    block-size: 1.1em;
    margin: 0;
    padding: 0;
    color: inherit;
    background: none;
    border: 0;
    cursor: pointer;
    transition: transform 120ms ease;
  }
  .tree__twistie--open {
    transform: rotate(90deg);
  }
  .tree__twistie-spacer {
    display: inline-block;
    flex: none;
    inline-size: 1.1em;
  }

  .tree__label {
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
