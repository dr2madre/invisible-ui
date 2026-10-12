<script lang="ts">
  import TreeView from "./TreeView.svelte";
  import type { TreeNode } from "./create-tree-view";

  const nodes: TreeNode[] = [{ value: "src" }, { value: "zzz-package" }];
  const shown: Record<string, string> = { src: "Sources", "zzz-package": "Package" };
</script>

<!-- The rows show text unrelated to their values: typeahead must match it. -->
<TreeView {nodes} label="Project files">
  {#snippet labelContent({ node })}{shown[node.value]}{/snippet}
</TreeView>
