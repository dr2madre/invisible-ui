<script lang="ts">
  import Tooltip from "./Tooltip.svelte";
  export let text = "Copy to clipboard";
  export let openDelay = 0;
</script>

<Tooltip {text} {openDelay} closeDelay={0}>
  <button>Copy</button>
</Tooltip>
