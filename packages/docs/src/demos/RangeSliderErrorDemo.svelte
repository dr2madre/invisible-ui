<script>
  import RangeSlider from "@design-system/svelte/RangeSlider.svelte";
  let price = $state.raw([20, 90]);
</script>

<!-- The app owns the error: it sets it from the pair and clears it. -->
<RangeSlider
  value={price}
  step={5}
  label="Ticket price"
  thumbLabels={["Lowest ticket price", "Highest ticket price"]}
  showValue
  error={price[1] > 80 ? "The highest ticket price is 80." : ""}
  onValueChange={(next) => (price = next)}
/>
