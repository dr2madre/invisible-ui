<script lang="ts">
  import Dialog from "./Dialog.svelte";

  export let open = false;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
</script>

<button type="button">before</button>
<Dialog {open} {onOpenChange} title="Edit profile" description="Update your details.">
  <span slot="trigger">Open dialog</span>
  <label>Name <input type="text" /></label>
  <button type="button">Save</button>
</Dialog>
