<script>
  import RangeSlider from "@design-system/svelte/RangeSlider.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
  let price = [20, 80];
</script>

<div class="range-slider-demo">
  <!-- Value output + min/max reference labels -->
  <RangeSlider
    value={price}
    min={0}
    max={100}
    step={5}
    label="Price range"
    thumbLabels={["Minimum price", "Maximum price"]}
    showValue
    showRange
    onValueChange={(next) => (price = next)}
  />

  <!-- A gap the two thumbs may not close -->
  <RangeSlider
    value={[30, 70]}
    min={0}
    max={100}
    minDistance={20}
    label="Temperature range"
    thumbLabels={["Lowest temperature", "Highest temperature"]}
    format={(value) => `${value}°`}
    showValue
  />

  <!-- Leading icon (labels what's being changed; the inputs keep their own
       accessible names) + stepped ticks -->
  <RangeSlider
    value={[2, 4]}
    min={0}
    max={5}
    step={1}
    label="Rating range"
    thumbLabels={["Lowest rating", "Highest rating"]}
    ticks
    showValue
    showRange
  >
    <Icon slot="icon">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      />
    </Icon>
  </RangeSlider>
</div>

<style>
  .range-slider-demo {
    display: grid;
    gap: 1.5rem;
    inline-size: 20rem;
    max-inline-size: 100%;
    /* The preview lays its children out with flex, where an item refuses to
       shrink past its content unless told it may. */
    min-inline-size: 0;
  }
</style>
