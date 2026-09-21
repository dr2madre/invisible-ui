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

  export let expanded: string[] = ["src"];
  export let selected: string | null = null;
  export let nodes: TreeNode[] = defaultNodes;
  export let loading: string[] = [];
  export let loadErrors: string[] = [];
  export let onLoadChildren: ((request: TreeLoadRequest) => void) | undefined = undefined;
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
