<script>
  import DotGrid from "@design-system/svelte/DotGrid.svelte";
</script>

<!-- Fills a panel while its content is being generated. The dots tile the whole
     surface and a lit band sweeps across continuously. -->
<div
  style="position: relative; inline-size: 100%; max-inline-size: 26rem; aspect-ratio: 16 / 10; border: 1px solid var(--ds-color-border); border-radius: 0.75rem; overflow: hidden; color: var(--ds-color-text);"
>
  <DotGrid label="Generating image" />
</div>
