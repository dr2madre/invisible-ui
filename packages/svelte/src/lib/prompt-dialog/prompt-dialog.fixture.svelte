<script lang="ts">
  import PromptDialog from "./PromptDialog.svelte";

  interface Props {
    open?: boolean;
    value?: string;
    confirmValue?: string;
    onConfirm?: (value: string) => void;
    urgent?: boolean;
  }

  let { open = false, value = "report", confirmValue, onConfirm, urgent = false }: Props = $props();
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
