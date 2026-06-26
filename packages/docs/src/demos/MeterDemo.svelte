<script>
  import Meter from "@design-system/svelte/Meter.svelte";
</script>

<div style="max-width: 22rem; display: flex; flex-direction: column; gap: 1rem;">
  <Meter value={72} label="Disk usage" low={25} high={80} />
  <Meter value={92} label="Memory" low={25} high={80} />
</div>
