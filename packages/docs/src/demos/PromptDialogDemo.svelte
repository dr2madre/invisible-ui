<script>
  import PromptDialog from "@design-system/svelte/PromptDialog.svelte";

  const file = "report-q3.pdf";
  let renamed = "";
  let deleted = false;
</script>

<div style="display: grid; gap: 1.5rem;">
  <!-- The prompt() job proper: ask for a value. Required here; Enter confirms. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
      <PromptDialog
        title="Rename file"
        label="File name"
        value={file}
        required
        confirmLabel="Rename"
        cancelLabel="Keep name"
        onConfirm={(value) => (renamed = value)}
      >
        Rename file
      </PromptDialog>
      {#if renamed}
        <span style="font-size: 0.875rem; color: var(--ds-color-text-secondary);">
          Renamed to “{renamed}”.
        </span>
      {/if}
    </div>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Ask for a value (<code>required</code>; Enter confirms).
    </figcaption>
  </figure>

  <!-- Type-to-confirm at interrupting urgency: the confirmValue gate keeps
       Delete disabled until the typed name matches; urgent switches the role
       to alertdialog. Same wording as the Confirm dialog example. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
      <PromptDialog
        urgent
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
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      Type-to-confirm gate (<code>confirmValue</code>) with <code>urgent</code> — same choice as
      <strong>Confirm dialog</strong>, gated by the input.
    </figcaption>
  </figure>
</div>
