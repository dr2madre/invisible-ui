<script>
  import AlertDialog from "@design-system/svelte/AlertDialog.svelte";

  const file = "report-q3.pdf";
</script>

<div style="display: grid; gap: 1.5rem;">
  <!-- Title = the topic; the question + consequence live in the body; the
       buttons name the object, not just the verb. Same wording is reused by
       ConfirmDialog and PromptDialog so the family reads consistently. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <AlertDialog
      title="Delete file"
      description={`Do you want to delete “${file}”? The file will be permanently deleted.`}
      actionLabel="Delete file"
      cancelLabel="Keep file"
      actionVariant="danger"
    >
      Delete file
    </AlertDialog>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Plain yes/no — same choice as <strong>Confirm dialog</strong>, at alert urgency.
    </figcaption>
  </figure>

  <!-- Type-to-confirm: high-safety destructive action. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <AlertDialog
      title="Delete file"
      description={`Do you want to delete “${file}”? The file will be permanently deleted.`}
      actionLabel="Delete file"
      cancelLabel="Keep file"
      actionVariant="danger"
      confirmPhrase={file}
      confirmHint="Type the file name to confirm"
    >
      Delete (type to confirm)
    </AlertDialog>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Type-to-confirm — same input as <strong>Prompt dialog</strong>, at alert urgency.
    </figcaption>
  </figure>
</div>
