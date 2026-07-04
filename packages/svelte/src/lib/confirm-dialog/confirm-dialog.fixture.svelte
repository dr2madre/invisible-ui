<script lang="ts">
  import ConfirmDialog from "./ConfirmDialog.svelte";

  export let open = false;
  export let onConfirm: (() => void) | undefined = undefined;
</script>

<ConfirmDialog {open} {onConfirm} title="Discard changes?" description="Your edits will be lost.">
  Discard
</ConfirmDialog>
