<script>
  import ConfirmDialog from "@design-system/svelte/ConfirmDialog.svelte";

  let discarded = 0;
</script>

<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
  <ConfirmDialog
    title="Discard changes?"
    description="Your unsaved edits will be lost."
    confirmLabel="Discard"
    confirmVariant="danger"
    onConfirm={() => (discarded += 1)}
  >
    Discard changes
  </ConfirmDialog>

  {#if discarded}
    <span style="font-size: 0.875rem; color: var(--ds-color-text-secondary);">
      Discarded {discarded} time{discarded === 1 ? "" : "s"}.
    </span>
  {/if}
</div>
