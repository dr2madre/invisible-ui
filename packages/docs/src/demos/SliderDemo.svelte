<script>
  import Slider from "@design-system/svelte/Slider.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
  let value = 40;
</script>

<div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 22rem;">
  <!-- Value output + min/max reference labels -->
  <Slider
    {value}
    min={0}
    max={100}
    step={5}
    label="Volume"
    showValue
    showRange
    onValueChange={(v) => (value = v)}
  />

  <!-- Leading icon (labels what's being changed; the input keeps the accessible
       name) + value -->
  <Slider value={60} min={0} max={100} label="Volume" showValue>
    <Icon slot="icon">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </Icon>
  </Slider>

  <!-- Stepped (ticks) -->
  <Slider value={2} min={0} max={5} step={1} label="Rating" ticks showValue showRange />
</div>
