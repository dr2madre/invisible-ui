<script>
  import AlertDialog from "@design-system/svelte/AlertDialog.svelte";

  const file = "report-q3.pdf";
</script>

<div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
  <!-- Title = the topic; the question + consequence live in the body; the
       buttons name the object, not just the verb. -->
  <AlertDialog
    title="Delete file"
    description={`Do you want to delete “${file}”? The file will be permanently deleted.`}
    actionLabel="Delete file"
    cancelLabel="Keep file"
    actionVariant="danger"
  >
    Delete file
  </AlertDialog>

  <!-- Type-to-confirm: high-safety destructive action. -->
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
</div>
