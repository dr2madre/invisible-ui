<script>
  import ConfirmDialog from "@design-system/svelte/ConfirmDialog.svelte";

  const file = "report-q3.pdf";
  let deleted = false;
  let deletedUrgent = false;
</script>

<div style="display: grid; gap: 1.5rem;">
  <!-- The confirm() job: cancel stops the process, confirm proceeds. Buttons
       name outcomes ("Delete file" / "Keep file"), never a bare yes/no. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
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
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Routine confirmation (<code>role="dialog"</code>).
    </figcaption>
  </figure>

  <!-- Same choice at interrupting urgency: urgent switches the role to
       alertdialog (announced immediately by screen readers), nothing else. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
      <ConfirmDialog
        urgent
        title="Delete file"
        description={`Do you want to delete “${file}”? The file will be permanently deleted.`}
        confirmLabel="Delete file"
        cancelLabel="Keep file"
        confirmVariant="danger"
        triggerVariant="danger"
        onConfirm={() => (deletedUrgent = true)}
      >
        Delete (urgent)
      </ConfirmDialog>
      {#if deletedUrgent}
        <span style="font-size: 0.875rem; color: var(--ds-color-text-secondary);">
          “{file}” deleted.
        </span>
      {/if}
    </div>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Same choice with <code>urgent</code> (<code>role="alertdialog"</code>).
    </figcaption>
  </figure>
</div>
