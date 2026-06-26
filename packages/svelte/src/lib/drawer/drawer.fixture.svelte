<script lang="ts">
  import Drawer from "./Drawer.svelte";

  export let open = false;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
</script>

<button type="button">before</button>
<Drawer {open} {onOpenChange} title="Account" description="Manage your account.">
  <span slot="trigger">Open drawer</span>
  <button type="button">Sign out</button>
</Drawer>
