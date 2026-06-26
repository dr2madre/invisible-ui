<script lang="ts">
  import ScrollArea from "./ScrollArea.svelte";
  import type { ScrollOrientation } from "./create-scroll-area";

  export let orientation: ScrollOrientation = "vertical";
  export let label: string | undefined = undefined;
</script>

<ScrollArea {orientation} {label} maxHeight="8rem">
  <p>Line one of scrollable content.</p>
  <p>Line two.</p>
  <p>Line three.</p>
  <p>Line four.</p>
  <p>Line five — keep scrolling.</p>
</ScrollArea>
