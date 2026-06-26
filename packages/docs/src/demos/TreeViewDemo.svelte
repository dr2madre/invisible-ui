<script>
  import TreeView from "@design-system/svelte/TreeView.svelte";

  const nodes = [
    {
      value: "src",
      children: [
        { value: "index.ts" },
        { value: "lib", children: [{ value: "button.ts" }, { value: "input.ts" }] },
      ],
    },
    { value: "package.json" },
    { value: "README.md" },
  ];
</script>

<TreeView {nodes} expanded={["src"]} selected="index.ts" label="Project files" />
