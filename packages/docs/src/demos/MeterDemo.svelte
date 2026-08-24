<script>
  import Meter from "@design-system/svelte/Meter.svelte";
</script>

<div class="meters">
  <Meter value={72} label="Disk usage" low={25} high={80} />
  <Meter value={92} label="Memory" low={25} high={80} />
  <!-- Below the low mark: the only state that paints the danger fill. -->
  <Meter value={12} label="Battery" low={25} high={80} />
</div>

<style>
  .meters {
    max-inline-size: 22rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
