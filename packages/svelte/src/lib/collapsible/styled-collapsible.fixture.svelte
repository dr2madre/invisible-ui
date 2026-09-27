<script lang="ts">
  import Collapsible from "./Collapsible.svelte";

  interface Props {
    open?: boolean;
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = false, disabled = false, onOpenChange }: Props = $props();
</script>

<Collapsible {open} {disabled} {onOpenChange}>
  {#snippet trigger()}<span>Details</span>{/snippet}
  <p>Hidden details here.</p>
</Collapsible>
