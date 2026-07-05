<script lang="ts">
  import ConfirmDialog from "./ConfirmDialog.svelte";

  export let open = false;
  export let onConfirm: (() => void) | undefined = undefined;
  export let description: string | undefined = "Your edits will be lost.";
  export let urgent = false;
</script>

<ConfirmDialog {open} {onConfirm} {description} {urgent} title="Discard changes?"
  >Discard</ConfirmDialog
>
