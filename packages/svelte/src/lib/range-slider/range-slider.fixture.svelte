<script lang="ts">
  import RangeSlider from "./RangeSlider.svelte";

  interface Props {
    value?: readonly [number, number];
    min?: number;
    max?: number;
    step?: number;
    minDistance?: number;
    disabled?: boolean;
    orientation?: "horizontal" | "vertical";
    ticks?: boolean;
    name?: string;
    onValueChange?: (value: readonly [number, number]) => void;
  }

  let {
    value = [20, 80],
    min = 0,
    max = 100,
    step = 1,
    minDistance = 0,
    disabled = false,
    orientation = "horizontal",
    ticks = false,
    name,
    onValueChange,
  }: Props = $props();
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
    {ticks}
    {name}
    label="Price"
    thumbLabels={["Minimum price", "Maximum price"]}
    {onValueChange}
  />
</form>
