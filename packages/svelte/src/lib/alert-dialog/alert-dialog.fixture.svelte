<script lang="ts">
  import AlertDialog from "./AlertDialog.svelte";

  export let onDismiss: (() => void) | undefined = undefined;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
  export let closeOnOutsideClick = true;
  export let dismissLabel: string | undefined = undefined;
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
