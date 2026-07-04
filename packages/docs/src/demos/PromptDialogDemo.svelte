<script>
  import PromptDialog from "@design-system/svelte/PromptDialog.svelte";

  const fileName = "report-2026.pdf";
  let deleted = false;
</script>

<div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
  <!-- Type-to-confirm delete: the Delete button stays disabled until the typed
       text matches the file name (GitHub-style). -->
  <PromptDialog
    title="Delete file"
    description="This can't be undone. Type the file name to confirm."
    label="File name"
    placeholder={fileName}
    confirmValue={fileName}
    confirmLabel="Delete file"
    confirmVariant="danger"
    triggerVariant="danger"
    onConfirm={() => (deleted = true)}
  >
    Delete {fileName}
  </PromptDialog>

  {#if deleted}
    <span style="font-size: 0.875rem; color: var(--ds-color-text-secondary);">
      “{fileName}” deleted.
    </span>
  {/if}
</div>
