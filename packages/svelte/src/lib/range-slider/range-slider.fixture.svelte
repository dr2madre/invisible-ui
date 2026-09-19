<script lang="ts">
  import RangeSlider from "./RangeSlider.svelte";

  export let value: readonly [number, number] = [20, 80];
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let minDistance = 0;
  export let disabled = false;
  export let orientation: "horizontal" | "vertical" = "horizontal";
  export let name: string | undefined = undefined;
  export let onValueChange: ((value: readonly [number, number]) => void) | undefined = undefined;
</script>

<form data-testid="form">
  <RangeSlider
    {value}
    {min}
    {max}
    {step}
    {minDistance}
    {disabled}
    {orientation}
    {name}
    label="Price"
    thumbLabels={["Minimum price", "Maximum price"]}
    {onValueChange}
  />
</form>
