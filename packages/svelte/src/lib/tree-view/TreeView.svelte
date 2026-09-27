<script lang="ts">
  /**
   * TreeView — the styled, batteries-included tree (WAI-ARIA tree pattern):
   * single selection, expand/collapse, roving tabindex and full arrow-key
   * navigation. Behaviour and accessibility come from the headless tree in
   * `@design-system/core`.
   *
   * Pass a (possibly nested) `nodes` forest. Each node renders a row; parents get
   * a disclosure twistie. Labels default to the node `value`; override per node
   * via the `labelContent` snippet (`{ node }`) or a `labels` map. The snippet
   * cannot be called `label`, which is the tree's accessible name. An optional
   * `icon` snippet (`{ node }`) leads each row.
   *
   * The tree is rendered as a flat list of `treeitem`s carrying `aria-level`,
   * `aria-setsize` and `aria-posinset` (a valid alternative to nested `group`s),
   * which keeps the DOM order aligned with keyboard navigation. The control needs
   * an accessible name via `label`. Colors are themeable (`--ds-tree-*`).
   */
  import { untrack, type Snippet } from "svelte";
  import { getI18n } from "../i18n/create-i18n";
  import {
    createTreeView,
    type TreeContext,
    type TreeLoadRequest,
    type TreeNode,
    type VisibleNode,
  } from "./create-tree-view";
  import { controllable } from "../internal/controllable.svelte";

  const { t } = getI18n();

  interface Props {
    nodes: TreeNode[];
    expanded?: string[];
    selected?: string | null;
    /** Unloaded parent values with an active request. */
    loading?: string[];
    /** Unloaded parent values whose latest request failed. */
    loadErrors?: string[];
    disabled?: boolean;
    /** Accessible name for the tree (announced by screen readers). */
    label: string;
    /** Optional per-node display labels, keyed by node value. */
    labels?: Record<string, string>;
    /** Called whenever the expanded set changes. */
    onExpandedChange?: (expanded: string[]) => void;
    /** Called whenever the selected value changes. */
    onSelectedChange?: (selected: string) => void;
    /** Requests children from the application; the component never fetches. */
    onLoadChildren?: (request: TreeLoadRequest) => void;
    /** Leading icon of a row, hidden from assistive tech. */
    icon?: Snippet<[{ node: VisibleNode }]>;
    /** A row's label. Defaults to `labels[node.value]`, then the node value. */
    labelContent?: Snippet<[{ node: VisibleNode }]>;
  }

  let {
    nodes,
    expanded = $bindable([]),
    selected = $bindable(null),
    loading = [],
    loadErrors = [],
    disabled = false,
    label,
    labels,
    onExpandedChange,
    onSelectedChange,
    onLoadChildren,
    icon,
    labelContent,
  }: Props = $props();

  // Seeded once from the first props; the mirrors below follow later ones.
  const context: TreeContext = untrack(() => ({
    nodes,
    expanded,
    selected,
    loading,
    loadErrors,
    disabled,
    // Live callback references (ADR 0011).
    onExpandedChange: (next) => onExpandedChange?.(next),
    onSelectedChange: (next) => onSelectedChange?.(next),
    onLoadChildren: (request) => onLoadChildren?.(request),
  }));

  const tree = createTreeView(context);
  const {
    api,
    rootAction,
    itemAction,
    visible,
    expanded: expandedStore,
    selected: selectedStore,
    syncNodes,
    syncDisabled,
    syncExpanded,
    syncSelected,
    syncLoading,
    syncLoadErrors,
  } = tree;

  controllable({ get: () => nodes, reflect: syncNodes });
  controllable({ get: () => disabled, reflect: syncDisabled });

  // Controllable mirrors, compared against the last prop values (ADR 0011):
  // the expanded set is compared by content, so a parent echoing it back does
  // not churn. A sync never reports a change.
  controllable({ get: () => expanded, reflect: syncExpanded });
  controllable({ get: () => selected, reflect: syncSelected });
  controllable({ get: () => loading, reflect: syncLoading });
  controllable({ get: () => loadErrors, reflect: syncLoadErrors });
</script>

<ul class="tree" use:rootAction aria-label={label}>
  {#each $visible as node (node.value)}
    {@const isSelected = $selectedStore === node.value}
    {@const isExpanded = $expandedStore.includes(node.value)}
    <li
      class={["tree__item", isSelected && "tree__item--selected"]}
      style="--_tree-level: {node.level}"
      use:itemAction={node.value}
    >
      {#if node.hasChildren}
        <button
          type="button"
          class={["tree__twistie", isExpanded && "tree__twistie--open"]}
          tabindex="-1"
          aria-hidden="true"
          onclick={(event) => {
            event.stopPropagation();
            if (node.loadState === "error") $api.retryLoad(node.value);
            else tree.toggle(node.value);
          }}
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
      {#if icon}
        <span class="tree__icon" aria-hidden="true">{@render icon({ node })}</span>
      {/if}
      <span id={node.labelId} class="tree__label">
        {#if labelContent}{@render labelContent({ node })}{:else}{labels?.[node.value] ??
            node.value}{/if}
      </span>
      {#if node.loadState === "loading" || node.loadState === "error"}
        <span
          id={node.loadStatusId}
          class={["tree__load-status", node.loadState === "error" && "tree__load-status--error"]}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {node.loadState === "error"
            ? $t("tree.loadError", { name: labels?.[node.value] ?? node.value })
            : $t("tree.loading", { name: labels?.[node.value] ?? node.value })}
        </span>
      {/if}
      <!-- The check's space is always reserved (hidden when unselected) so a
           selected row is no wider than its siblings — the check never overflows. -->
      <span class={["tree__check", isSelected && "tree__check--shown"]} aria-hidden="true">
        <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
          <path
            d="M3.5 8.5l3 3 6-6.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
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
    color: var(--ds-color-text, #282420);
    background: var(--ds-tree-bg, transparent);
    border-radius: var(--ds-tree-radius, var(--ds-radius-surface, 0.75rem));
  }

  .tree__item {
    display: flex;
    align-items: center;
    gap: var(--ds-tree-gap, 0.35rem);
    /* Indent by depth; level is 1-based. */
    padding-block: var(--ds-tree-item-padding-block, 0.3rem);
    padding-inline-end: 0.5rem;
    padding-inline-start: calc(
      0.4rem + (var(--_tree-level, 1) - 1) * var(--ds-tree-indent, 1.1rem)
    );
    border-radius: var(--ds-tree-item-radius, var(--ds-radius-control, 0.5rem));
    cursor: pointer;
    user-select: none;
  }
  .tree__item:hover {
    background: var(--ds-tree-item-hover, var(--ds-color-neutral-surface, #f4f2ef));
  }
  .tree__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    inline-size: 1.1em;
    block-size: 1.1em;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .tree__icon :global(svg) {
    inline-size: 100%;
    block-size: 100%;
  }
  .tree__check {
    margin-inline-start: auto;
    display: inline-flex;
    flex: none;
    inline-size: 1em;
    color: var(--ds-color-secondary, #7a52cc);
    /* Always present (reserves width); only shown on the selected row. */
    visibility: hidden;
  }
  .tree__load-status {
    min-inline-size: 0;
    margin-inline-start: auto;
    color: var(--ds-color-text-secondary, #524c44);
    font-size: var(--ds-tree-status-font-size, 0.875rem);
  }
  .tree__load-status--error {
    color: var(--ds-color-danger-text, #9f1b1b);
  }
  .tree__load-status + .tree__check {
    margin-inline-start: 0;
  }
  .tree__check--shown {
    visibility: visible;
  }
  .tree__item--selected {
    background: var(
      --ds-tree-item-selected-bg,
      color-mix(in srgb, var(--ds-color-secondary, #7a52cc) 10%, transparent)
    );
    color: var(--ds-tree-item-selected-text, var(--ds-color-text, #282420));
  }
  .tree__item--selected:hover {
    background: var(
      --ds-tree-item-selected-hover,
      color-mix(in srgb, var(--ds-color-secondary, #7a52cc) 16%, transparent)
    );
  }
  .tree__item:global(:focus-visible) {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
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
    /* The arrow keeps its size; the pressable area is at least 24px square. */
    inline-size: 1.5rem;
    block-size: 1.5rem;
    font-size: 1.1em;
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
