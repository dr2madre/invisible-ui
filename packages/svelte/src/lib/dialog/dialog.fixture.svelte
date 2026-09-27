<script lang="ts">
  import Dialog from "./Dialog.svelte";

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = false, onOpenChange }: Props = $props();
</script>

<button type="button">before</button>
<Dialog {open} {onOpenChange} title="Edit profile" description="Update your details.">
  {#snippet trigger()}<span>Open dialog</span>{/snippet}
  <label>Name <input type="text" /></label>
  <button type="button">Save</button>
</Dialog>
