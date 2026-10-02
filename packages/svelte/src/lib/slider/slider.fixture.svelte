<script lang="ts">
  import { untrack } from "svelte";
  import { createSlider } from "./create-slider";

  interface Props {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    onValueChange?: (value: number) => void;
  }

  let {
    value = 0,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    onValueChange,
  }: Props = $props();

  // Seeded once from the first props.
  const { value: sliderValue, setValue } = untrack(() =>
    createSlider({
      value,
      min,
      max,
      step,
      disabled,
      onValueChange,
    }),
  );

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
  oninput={onInput}
/>
