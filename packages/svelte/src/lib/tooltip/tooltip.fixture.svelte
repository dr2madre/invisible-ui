<script lang="ts">
  import Tooltip from "./Tooltip.svelte";
  export let text = "Copy to clipboard";
</script>

<Tooltip {text} openDelay={0} closeDelay={0}>
  <button>Copy</button>
</Tooltip>
