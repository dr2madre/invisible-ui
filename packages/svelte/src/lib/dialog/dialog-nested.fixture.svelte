<script lang="ts">
  import Dialog from "./Dialog.svelte";
  import ConfirmDialog from "../confirm-dialog/ConfirmDialog.svelte";
</script>

<Dialog title="Edit profile" initialFocus="input">
  <span slot="trigger">Edit profile</span>
  <label>Name <input type="text" /></label>
  <ConfirmDialog title="Discard changes?" description="Your edits will be lost."
    >Discard</ConfirmDialog
  >
</Dialog>
