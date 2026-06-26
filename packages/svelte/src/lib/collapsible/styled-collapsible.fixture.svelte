<script lang="ts">
  import Collapsible from "./Collapsible.svelte";

  export let open = false;
  export let disabled = false;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
</script>

<Collapsible {open} {disabled} {onOpenChange}>
  <span slot="trigger">Details</span>
  <p>Hidden details here.</p>
</Collapsible>
