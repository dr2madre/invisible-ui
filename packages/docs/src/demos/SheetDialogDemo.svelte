<script>
  import SheetDialog from "@design-system/svelte/SheetDialog.svelte";
</script>

<div style="display: grid; gap: 1.5rem;">
  <!-- The classic side panel: a task (filters) the user finishes or cancels. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <SheetDialog title="Filters" description="Refine the results." initialFocus="input">
      <span slot="trigger">Open filters</span>
      <label style="display: grid; gap: 0.25rem; font-size: 0.875rem;">
        Query
        <input type="text" style="font: inherit; padding: 0.4rem 0.6rem;" />
      </label>
      <svelte:fragment slot="footer">
        <button type="button">Apply</button>
      </svelte:fragment>
    </SheetDialog>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Right panel (default side) with a pinned footer.
    </figcaption>
  </figure>

  <!-- Bottom variant with the drag-to-dismiss gesture. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <SheetDialog side="bottom" draggable title="Account" description="Manage your account.">
      <span slot="trigger">Open bottom panel</span>
      <button type="button">Sign out</button>
    </SheetDialog>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Bottom variant with <code>draggable</code> — drag the handle past a quarter of the panel (or flick)
      to dismiss.
    </figcaption>
  </figure>

  <!-- Lateral variant with the same gesture. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <SheetDialog side="left" draggable title="Navigation" description="Jump to a section.">
      <span slot="trigger">Open left panel</span>
      <button type="button">Home</button>
    </SheetDialog>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Lateral variant with <code>draggable</code> — the handle sits on the inner edge.
    </figcaption>
  </figure>
</div>
