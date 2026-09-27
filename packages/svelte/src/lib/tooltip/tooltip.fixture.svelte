<script lang="ts">
  import Tooltip from "./Tooltip.svelte";

  interface Props {
    text?: string;
    openDelay?: number;
  }

  let { text = "Copy to clipboard", openDelay = 0 }: Props = $props();
</script>

<Tooltip {text} {openDelay} closeDelay={0}>
  <button>Copy</button>
</Tooltip>
