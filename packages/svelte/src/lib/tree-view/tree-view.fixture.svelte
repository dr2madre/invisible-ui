<script lang="ts">
  import TreeView from "./TreeView.svelte";
  import type { TreeLoadRequest, TreeNode } from "./create-tree-view";

  const defaultNodes: TreeNode[] = [
    {
      value: "src",
      children: [
        { value: "index.ts" },
        { value: "lib", children: [{ value: "button.ts" }, { value: "input.ts" }] },
      ],
    },
    { value: "readme", disabled: true },
    { value: "package.json" },
  ];

  interface Props {
    expanded?: string[];
    selected?: string | null;
    nodes?: TreeNode[];
    loading?: string[];
    loadErrors?: string[];
    onLoadChildren?: (request: TreeLoadRequest) => void;
  }

  let {
    expanded = ["src"],
    selected = null,
    nodes = defaultNodes,
    loading = [],
    loadErrors = [],
    onLoadChildren,
  }: Props = $props();
</script>

<TreeView
  {nodes}
  {expanded}
  {selected}
  {loading}
  {loadErrors}
  {onLoadChildren}
  label="Project files"
/>
