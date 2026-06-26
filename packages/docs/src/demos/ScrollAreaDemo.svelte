<script>
  import ScrollArea from "@design-system/svelte/ScrollArea.svelte";
</script>

<div style="max-width: 20rem;">
  <ScrollArea maxHeight="9rem" label="Release notes">
    <div style="display: flex; flex-direction: column; gap: 0.5rem; padding-right: 0.75rem;">
      {#each Array(12) as _, i (i)}
        <p style="margin: 0;">Line {i + 1} — scroll to see the custom scrollbar.</p>
      {/each}
    </div>
  </ScrollArea>
</div>
