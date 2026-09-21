<script lang="ts">
  import TreeView from "@design-system/svelte/TreeView.svelte";
  import type { TreeLoadRequest, TreeNode } from "@design-system/svelte";

  let nodes: TreeNode[] = [
    { value: "production", hasChildren: true },
    { value: "archive", hasChildren: true },
  ];
  let expanded: string[] = [];
  let loading: string[] = [];
  let loadErrors: string[] = [];
  const latest: Record<string, number> = {};
  const attempts: Record<string, number> = {};

  const children: Record<string, TreeNode[]> = {
    production: [{ value: "customers" }, { value: "orders" }],
    archive: [{ value: "orders_2025" }, { value: "orders_2024" }],
  };

  function replaceChildren(forest: TreeNode[], value: string, next: TreeNode[]): TreeNode[] {
    return forest.map((node) =>
      node.value === value
        ? { ...node, children: next }
        : node.children
          ? { ...node, children: replaceChildren(node.children, value, next) }
          : node,
    );
  }

  function loadChildren(request: TreeLoadRequest) {
    latest[request.value] = request.requestId;
    loading = [...new Set([...loading, request.value])];
    loadErrors = loadErrors.filter((value) => value !== request.value);
    const attempt = (attempts[request.value] ?? 0) + 1;
    attempts[request.value] = attempt;

    window.setTimeout(() => {
      if (latest[request.value] !== request.requestId) return;
      loading = loading.filter((value) => value !== request.value);
      if (request.value === "archive" && attempt === 1) {
        loadErrors = [...loadErrors, request.value];
        return;
      }
      nodes = replaceChildren(nodes, request.value, children[request.value] ?? []);
      loadErrors = loadErrors.filter((value) => value !== request.value);
    }, 600);
  }
</script>

<TreeView
  {nodes}
  {expanded}
  {loading}
  {loadErrors}
  label="Database catalog"
  onExpandedChange={(next) => (expanded = next)}
  onLoadChildren={loadChildren}
/>

<p class="hint">Archive fails once. Expand it again or press Right Arrow to retry.</p>

<style>
  .hint {
    margin-block: 0.75rem 0;
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-tree-status-font-size, 0.875rem);
  }
</style>
