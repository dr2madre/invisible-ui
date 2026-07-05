<script>
  import PromptDialog from "@design-system/svelte/PromptDialog.svelte";

  const file = "report-q3.pdf";
  let deleted = false;
</script>

<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
  <!-- Same wording as the AlertDialog type-to-confirm example. The Delete button
       stays disabled until the typed name matches the file (confirmValue gate). -->
  <PromptDialog
    title="Delete file"
    description={`Do you want to delete “${file}”? The file will be permanently deleted.`}
    label="Type the file name to confirm"
    placeholder={file}
    confirmValue={file}
    confirmLabel="Delete file"
    cancelLabel="Keep file"
    confirmVariant="danger"
    triggerVariant="danger"
    onConfirm={() => (deleted = true)}
  >
    Delete file
  </PromptDialog>

  {#if deleted}
    <span style="font-size: 0.875rem; color: var(--ds-color-text-secondary);">
      “{file}” deleted.
    </span>
  {/if}
</div>
