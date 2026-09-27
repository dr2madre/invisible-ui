<script lang="ts">
  import Dialog from "./Dialog.svelte";
  import ConfirmDialog from "../confirm-dialog/ConfirmDialog.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
</script>

<!-- The docs composition: a tooltip around the editor, whose focus listeners
     see every focus change inside both dialogs. -->
<Tooltip text="Update your profile details">
  <Dialog title="Edit profile">
    {#snippet trigger()}<span>Edit profile</span>{/snippet}
    <p>Body</p>
    {#snippet footer()}
      <ConfirmDialog title="Discard changes?" description="Your edits will be lost."
        >Discard</ConfirmDialog
      >
    {/snippet}
  </Dialog>
</Tooltip>
