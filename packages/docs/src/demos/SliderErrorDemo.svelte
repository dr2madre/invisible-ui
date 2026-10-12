<script>
  import Slider from "@design-system/svelte/Slider.svelte";
  let value = $state(0);
</script>

<!-- The app owns the error: it sets it from the value and clears it. -->
<Slider
  {value}
  label="Alarm volume"
  showValue
  error={value === 0 ? "Choose a volume above zero." : ""}
  onValueChange={(next) => (value = next)}
/>
