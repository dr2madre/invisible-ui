<script lang="ts">
  import Popover from "./Popover.svelte";

  interface Props {
    onOpenChange?: (open: boolean) => void;
    label?: string;
  }

  let { onOpenChange, label }: Props = $props();
</script>

<button>before</button>
<Popover {onOpenChange} {label}>
  {#snippet triggerContent()}<span>Open popover</span>{/snippet}
  <p>Popover body</p>
  <button class="inside">Action</button>
</Popover>
<button>after</button>
