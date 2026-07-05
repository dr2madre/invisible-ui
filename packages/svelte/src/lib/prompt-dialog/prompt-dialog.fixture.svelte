<script lang="ts">
  import PromptDialog from "./PromptDialog.svelte";

  export let open = false;
  export let value = "report";
  export let confirmValue: string | undefined = undefined;
  export let onConfirm: ((value: string) => void) | undefined = undefined;
  export let urgent = false;
</script>

<PromptDialog
  {open}
  {onConfirm}
  {value}
  {confirmValue}
  {urgent}
  title="Rename file"
  label="File name"
>
  Rename
</PromptDialog>
