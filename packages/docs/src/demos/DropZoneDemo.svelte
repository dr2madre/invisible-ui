<script>
  import DropZone from "@design-system/svelte/DropZone.svelte";

  let names = [];
</script>

<div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 26rem;">
  <DropZone
    accept="image/*"
    multiple
    caption="PNG, JPG or GIF — up to 5 MB."
    onFiles={(files) => (names = files.map((f) => f.name))}
  />
  {#if names.length}
    <p style="margin: 0; font-size: 0.875rem; color: var(--ds-color-text-secondary);">
      Selected: {names.join(", ")}
    </p>
  {/if}
</div>
