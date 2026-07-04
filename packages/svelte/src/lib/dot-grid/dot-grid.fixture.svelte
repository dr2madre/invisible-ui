<script lang="ts">
  import DotGrid from "./DotGrid.svelte";

  export let label: string | undefined = undefined;
  export let decorative = false;
</script>

<DotGrid {label} {decorative} />
