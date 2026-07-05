<script>
  import AlertDialog from "@design-system/svelte/AlertDialog.svelte";

  const file = "report-q3.pdf";
</script>

<div style="display: grid; gap: 1.5rem;">
  <!-- The alert() job: an outcome to take note of — nothing to cancel. Here it
       is the epilogue of the family's delete-file story: Confirm/Prompt decide,
       Alert reports. The button names the outcome ("Done"), not a bare "OK". -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <AlertDialog
      title="File deleted"
      description={`“${file}” was permanently deleted.`}
      dismissLabel="Done"
    >
      Show outcome
    </AlertDialog>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Acknowledge an outcome — the epilogue of the <strong>Confirm dialog</strong> /
      <strong>Prompt dialog</strong> delete flow.
    </figcaption>
  </figure>

  <!-- Explicit acknowledgement: backdrop dismissal off, the user must press
       the button ("I understood"). -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <AlertDialog
      title="Scheduled maintenance"
      description="Saving will be unavailable on Sunday between 02:00 and 04:00 (UTC)."
      dismissLabel="I understood"
      closeOnOutsideClick={false}
    >
      Show notice
    </AlertDialog>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Explicit acknowledgement — <code>closeOnOutsideClick={"{false}"}</code> requires pressing the button.
    </figcaption>
  </figure>
</div>
