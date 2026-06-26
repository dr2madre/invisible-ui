<script lang="ts">
  import { createMeter } from "./create-meter";

  export let value = 0;
  export let min = 0;
  export let max = 100;
  export let low: number | undefined = undefined;
  export let high: number | undefined = undefined;

  const { rootAction, indicatorAction } = createMeter({ value, min, max, low, high });
</script>

<div use:rootAction aria-label="Disk usage">
  <div use:indicatorAction></div>
</div>
