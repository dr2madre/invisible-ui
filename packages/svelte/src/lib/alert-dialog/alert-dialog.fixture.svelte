<script lang="ts">
  import AlertDialog from "./AlertDialog.svelte";

  export let onAction: (() => void) | undefined = undefined;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
  export let closeOnOutsideClick = true;
</script>

<button type="button">before</button>
<AlertDialog
  title="Delete file?"
  description="This action cannot be undone."
  actionLabel="Delete"
  actionVariant="danger"
  {closeOnOutsideClick}
  {onAction}
  {onOpenChange}
>
  Delete file
</AlertDialog>
<button type="button">after</button>
