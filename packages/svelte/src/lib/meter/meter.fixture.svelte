<script lang="ts">
  import { untrack } from "svelte";
  import { createMeter } from "./create-meter";

  interface Props {
    value?: number;
    min?: number;
    max?: number;
    low?: number;
    high?: number;
  }

  let { value = 0, min = 0, max = 100, low, high }: Props = $props();

  const { rootAction, indicatorAction } = untrack(() =>
    createMeter({ value, min, max, low, high }),
  );
</script>

<div use:rootAction aria-label="Disk usage">
  <div use:indicatorAction></div>
</div>
