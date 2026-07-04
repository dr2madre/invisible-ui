<script lang="ts">
  import PromptDialog from "./PromptDialog.svelte";

  export let open = false;
  export let value = "report";
  export let confirmValue: string | undefined = undefined;
  export let onConfirm: ((value: string) => void) | undefined = undefined;
</script>

<PromptDialog {open} {onConfirm} {value} {confirmValue} title="Rename file" label="File name">
  Rename
</PromptDialog>
