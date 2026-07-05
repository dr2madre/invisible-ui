<script>
  import ConfirmDialog from "@design-system/svelte/ConfirmDialog.svelte";

  const file = "report-q3.pdf";
  let deleted = false;
</script>

<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
  <!-- Same wording as the AlertDialog example — a routine yes/no. The negative
       button says what staying does ("Keep file"), never "Cancel". -->
  <ConfirmDialog
    title="Delete file"
    description={`Do you want to delete “${file}”? The file will be permanently deleted.`}
    confirmLabel="Delete file"
    cancelLabel="Keep file"
    confirmVariant="danger"
    triggerVariant="danger"
    onConfirm={() => (deleted = true)}
  >
    Delete file
  </ConfirmDialog>

  {#if deleted}
    <span style="font-size: 0.875rem; color: var(--ds-color-text-secondary);">
      “{file}” deleted.
    </span>
  {/if}
</div>
