<script>
  import ToggleGroup from "@design-system/svelte/ToggleGroup.svelte";

  let format = ["bold"];
  const formatItems = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" },
  ];

  let view = ["grid"];
  const viewItems = [
    { value: "list", label: "List" },
    { value: "grid", label: "Grid" },
    { value: "columns", label: "Columns" },
  ];
</script>

<div style="display: flex; flex-direction: column; gap: 1rem; align-items: flex-start;">
  <!-- Text formatting: styled B / I / U glyphs -->
  <ToggleGroup
    items={formatItems}
    value={format}
    type="multiple"
    label="Text formatting"
    onValueChange={(v) => (format = v)}
  >
    <svelte:fragment slot="item" let:item>
      {#if item.value === "bold"}
        <span style="font-weight: 800;">B</span>
      {:else if item.value === "italic"}
        <span style="font-style: italic; font-family: Georgia, serif;">I</span>
      {:else}
        <span style="text-decoration: underline;">U</span>
      {/if}
    </svelte:fragment>
  </ToggleGroup>

  <!-- Single-select view switcher with icons -->
  <ToggleGroup
    items={viewItems}
    value={view}
    type="single"
    label="View"
    onValueChange={(v) => (view = v)}
  >
    <svelte:fragment slot="item" let:item>
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-label={item.label}
        role="img"
      >
        {#if item.value === "list"}
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        {:else if item.value === "grid"}
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        {:else}
          <rect x="3" y="3" width="5" height="18" />
          <rect x="10" y="3" width="5" height="18" />
          <rect x="17" y="3" width="4" height="18" />
        {/if}
      </svg>
    </svelte:fragment>
  </ToggleGroup>
</div>
