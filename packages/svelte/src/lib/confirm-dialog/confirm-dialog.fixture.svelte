<script lang="ts">
  import ConfirmDialog from "./ConfirmDialog.svelte";

  export let open = false;
  export let onConfirm: (() => void) | undefined = undefined;
  export let description: string | undefined = "Your edits will be lost.";
</script>

<ConfirmDialog {open} {onConfirm} {description} title="Discard changes?">Discard</ConfirmDialog>
