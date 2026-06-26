<script lang="ts">
  import { createSlider } from "./create-slider";

  export let value = 0;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let disabled = false;
  export let onValueChange: ((value: number) => void) | undefined = undefined;

  const { value: sliderValue, setValue } = createSlider({
    value,
    min,
    max,
    step,
    disabled,
    onValueChange,
  });

  function onInput(event: Event) {
    setValue(Number((event.currentTarget as HTMLInputElement).value));
  }
</script>

<input
  type="range"
  aria-label="Volume"
  {min}
  {max}
  {step}
  {disabled}
  value={$sliderValue}
  on:input={onInput}
/>
