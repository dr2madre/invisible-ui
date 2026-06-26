<script>
  import Slider from "@design-system/svelte/Slider.svelte";
  let value = 40;
</script>

<div style="max-width: 22rem;">
  <Slider {value} min={0} max={100} step={5} label="Volume" onValueChange={(v) => (value = v)} />
</div>
