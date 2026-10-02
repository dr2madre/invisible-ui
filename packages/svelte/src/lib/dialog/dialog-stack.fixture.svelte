<script lang="ts">
  import { flushSync } from "svelte";
  import Dialog from "./Dialog.svelte";
  import SheetDialog from "../sheet-dialog/SheetDialog.svelte";
  import AlertDialog from "../alert-dialog/AlertDialog.svelte";
  import ConfirmDialog from "../confirm-dialog/ConfirmDialog.svelte";

  interface Props {
    /** The dialog underneath: a Dialog or a Sheet Dialog. */
    below?: "dialog" | "sheet";
  }

  let { below = "dialog" }: Props = $props();

  let dialogOpen = $state(false);
  let alertOpen = $state(false);
  let confirmOpen = $state(false);

  export const openStates = () => ({ dialogOpen, alertOpen, confirmOpen });
  export const setDialogOpen = (next: boolean) => {
    dialogOpen = next;
    flushSync();
  };
  export const setAlertOpen = (next: boolean) => {
    alertOpen = next;
    flushSync();
  };
  export const setConfirmOpen = (next: boolean) => {
    confirmOpen = next;
    flushSync();
  };
</script>

{#if below === "dialog"}
  <Dialog bind:open={dialogOpen} title="Edit file">
    {#snippet trigger()}Edit{/snippet}
    <button type="button" data-delete onclick={() => (confirmOpen = true)}>Delete file</button>
    <AlertDialog bind:open={alertOpen} title="Saved" description="Your changes are saved."
      >Nested</AlertDialog
    >
  </Dialog>
{:else}
  <SheetDialog bind:open={dialogOpen} title="Filters">
    {#snippet trigger()}Open filters{/snippet}
    <button type="button" data-delete onclick={() => (confirmOpen = true)}>Reset filters</button>
  </SheetDialog>
{/if}
<ConfirmDialog bind:open={confirmOpen} title="Delete file?">Delete elsewhere</ConfirmDialog>
