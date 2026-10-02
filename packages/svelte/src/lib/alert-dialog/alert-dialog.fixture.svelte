<script lang="ts">
  import AlertDialog from "./AlertDialog.svelte";

  interface Props {
    onDismiss?: () => void;
    onOpenChange?: (open: boolean) => void;
    closeOnOutsideClick?: boolean;
    dismissLabel?: string;
  }

  let { onDismiss, onOpenChange, closeOnOutsideClick = true, dismissLabel }: Props = $props();
</script>

<button type="button">before</button>
<AlertDialog
  title="File deleted"
  description="“report-q3.pdf” was permanently deleted."
  {dismissLabel}
  {closeOnOutsideClick}
  {onDismiss}
  {onOpenChange}
>
  Show alert
</AlertDialog>
<button type="button">after</button>
