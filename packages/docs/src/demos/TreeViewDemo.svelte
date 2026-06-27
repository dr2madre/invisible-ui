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

<TreeView {nodes} expanded={["src", "lib"]} selected="index.ts" label="Project files">
  <!-- Per-item icon: a folder for parents, a file for leaves. -->
  <svg
    slot="icon"
    let:node
    viewBox="0 0 24 24"
    width="100%"
    height="100%"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {#if node.hasChildren}
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    {:else}
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    {/if}
  </svg>
</TreeView>
