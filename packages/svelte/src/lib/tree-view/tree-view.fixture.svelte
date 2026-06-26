<script lang="ts">
  import TreeView from "./TreeView.svelte";
  import type { TreeNode } from "./create-tree-view";

  export let expanded: string[] = ["src"];
  export let selected: string | null = null;

  const nodes: TreeNode[] = [
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
</script>

<TreeView {nodes} {expanded} {selected} label="Project files" />
