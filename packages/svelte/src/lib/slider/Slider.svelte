<script lang="ts">
  /**
   * Slider — a styled single-thumb slider built on a **native**
   * `<input type="range">`. The browser provides the slider role, ARIA value,
   * keyboard control (arrows / Page / Home / End), pointer dragging, focus and
   * form participation; this layer styles the track, the filled portion and the
   * thumb.
   *
   * Provide a `label` for the accessible name. Colors, sizing and the thumb are
   * themeable via `--ds-slider-*`.
   */
  import { createSlider } from "./create-slider";

  export let value = 0;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let orientation: "horizontal" | "vertical" = "horizontal";
  export let disabled = false;
  /** Accessible name for the slider. */
  export let label: string;
  /** Form field name — the value is submitted under it. */
  export let name: string | undefined = undefined;
  /** Called whenever the value changes. */
  export let onValueChange: ((value: number) => void) | undefined = undefined;

  const {
    value: sliderValue,
    percentage,
    setValue,
  } = createSlider({ value, min, max, step, orientation, disabled, onValueChange });

  function onInput(event: Event) {
    setValue(Number((event.currentTarget as HTMLInputElement).value));
  }
</script>

<span
  class="slider"
  class:slider--disabled={disabled}
  data-orientation={orientation}
  style="--ds-slider-pct: {$percentage}%"
>
  <input
    class="slider__input"
    type="range"
    {name}
    {min}
    {max}
    {step}
    {disabled}
    aria-label={label}
    aria-orientation={orientation}
    value={$sliderValue}
    on:input={onInput}
  />
</span>

<style>
  .slider {
    display: inline-flex;
  }
  .slider[data-orientation="horizontal"] {
    inline-size: var(--ds-slider-length, 14rem);
    align-items: center;
  }
  .slider[data-orientation="vertical"] {
    block-size: var(--ds-slider-length, 14rem);
    justify-content: center;
  }

  .slider__input {
    appearance: none;
    -webkit-appearance: none;
    margin: 0;
    background: transparent;
    cursor: pointer;
    inline-size: 100%;
  }
  .slider[data-orientation="vertical"] .slider__input {
    /* CSS-only vertical range: fills bottom-to-top. */
    writing-mode: vertical-lr;
    direction: rtl;
    block-size: 100%;
    inline-size: auto;
  }
  .slider--disabled .slider__input {
    cursor: not-allowed;
  }
  .slider--disabled {
    opacity: 0.5;
  }

  /* WebKit / Blink: track is filled with a hard-stop gradient at the value. */
  .slider__input::-webkit-slider-runnable-track {
    block-size: var(--ds-slider-thickness, 0.375rem);
    border-radius: 999px;
    background: linear-gradient(
      to right,
      var(--ds-slider-range, var(--ds-color-secondary, #7b52cc)) var(--ds-slider-pct, 0%),
      var(--ds-slider-track, var(--ds-color-border, #e2e8f0)) var(--ds-slider-pct, 0%)
    );
  }
  .slider[data-orientation="vertical"] .slider__input::-webkit-slider-runnable-track {
    inline-size: var(--ds-slider-thickness, 0.375rem);
    background: linear-gradient(
      to top,
      var(--ds-slider-range, var(--ds-color-secondary, #7b52cc)) var(--ds-slider-pct, 0%),
      var(--ds-slider-track, var(--ds-color-border, #e2e8f0)) var(--ds-slider-pct, 0%)
    );
  }
  .slider__input::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    inline-size: var(--ds-slider-thumb-size, 1rem);
    block-size: var(--ds-slider-thumb-size, 1rem);
    border-radius: 999px;
    background: var(--ds-slider-thumb, var(--ds-color-background, #fff));
    border: 2px solid var(--ds-slider-range, var(--ds-color-secondary, #7b52cc));
    /* Center the thumb on the track. */
    margin-block-start: calc(
      (var(--ds-slider-thickness, 0.375rem) - var(--ds-slider-thumb-size, 1rem)) / 2
    );
  }

  /* Firefox: a track plus a native progress fill. */
  .slider__input::-moz-range-track {
    block-size: var(--ds-slider-thickness, 0.375rem);
    border-radius: 999px;
    background: var(--ds-slider-track, var(--ds-color-border, #e2e8f0));
  }
  .slider__input::-moz-range-progress {
    block-size: var(--ds-slider-thickness, 0.375rem);
    border-radius: 999px;
    background: var(--ds-slider-range, var(--ds-color-secondary, #7b52cc));
  }
  .slider__input::-moz-range-thumb {
    inline-size: var(--ds-slider-thumb-size, 1rem);
    block-size: var(--ds-slider-thumb-size, 1rem);
    border-radius: 999px;
    background: var(--ds-slider-thumb, var(--ds-color-background, #fff));
    border: 2px solid var(--ds-slider-range, var(--ds-color-secondary, #7b52cc));
  }

  .slider__input:focus-visible {
    outline: none;
  }
  .slider__input:focus-visible::-webkit-slider-thumb {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
  .slider__input:focus-visible::-moz-range-thumb {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
</style>
