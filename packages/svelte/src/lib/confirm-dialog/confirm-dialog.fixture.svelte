<script lang="ts">
  import ConfirmDialog from "./ConfirmDialog.svelte";

  interface Props {
    open?: boolean;
    onConfirm?: () => void;
    description?: string;
    urgent?: boolean;
  }

  let {
    open = false,
    onConfirm,
    description = "Your edits will be lost.",
    urgent = false,
  }: Props = $props();
</script>

<ConfirmDialog {open} {onConfirm} {description} {urgent} title="Discard changes?"
  >Discard</ConfirmDialog
>
