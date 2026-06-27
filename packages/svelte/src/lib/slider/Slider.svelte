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
  /** Show the current value to the side of the track. */
  export let showValue = false;
  /** Show the min and max reference values under the ends of the track. */
  export let showRange = false;
  /** Show tick marks at each step (only when the count is reasonable). */
  export let ticks = false;
  /** Format the displayed value/range (e.g. add a unit). */
  export let format: (value: number) => string = (v) => String(v);
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

  // Tick positions (as %), shown only for a sane number of steps.
  $: tickCount = step > 0 ? Math.round((max - min) / step) : 0;
  $: tickPositions =
    ticks && tickCount > 0 && tickCount <= 20
      ? Array.from({ length: tickCount + 1 }, (_, i) => (i / tickCount) * 100)
      : [];
</script>

<div class="slider-field" class:slider-field--disabled={disabled}>
  <div class="slider-field__row">
    {#if $$slots.icon}
      <span class="slider-field__icon" aria-hidden="true"><slot name="icon" /></span>
    {/if}
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
      {#if tickPositions.length}
        <span class="slider__ticks" aria-hidden="true">
          {#each tickPositions as pos (pos)}
            <span class="slider__tick" style="inset-inline-start: {pos}%"></span>
          {/each}
        </span>
      {/if}
    </span>
    {#if showValue}
      <output class="slider-field__value">{format($sliderValue)}</output>
    {/if}
  </div>
  {#if showRange}
    <div class="slider-field__range" aria-hidden="true">
      <span>{format(min)}</span>
      <span>{format(max)}</span>
    </div>
  {/if}
</div>

<style>
  .slider-field {
    display: inline-flex;
    flex-direction: column;
    gap: 0.25rem;
    inline-size: var(--ds-slider-length, 14rem);
  }
  .slider-field--disabled {
    opacity: 0.5;
  }
  .slider-field__row {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }
  .slider-field__icon {
    display: inline-flex;
    flex: none;
    color: var(--ds-color-text-secondary, #57534e);
  }
  .slider-field__icon :global(svg) {
    inline-size: 1.2em;
    block-size: 1.2em;
  }
  .slider-field__value {
    flex: none;
    min-inline-size: 2.5ch;
    text-align: end;
    font-variant-numeric: tabular-nums;
    font-size: 0.875rem;
    color: var(--ds-color-text, #1c1917);
  }
  .slider-field__range {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--ds-color-text-secondary, #78716c);
  }

  .slider {
    position: relative;
    display: inline-flex;
    flex: 1;
  }
  /* Tick marks sit just under the track. */
  .slider__ticks {
    position: absolute;
    inset-inline: 0;
    inset-block-start: 50%;
    block-size: 0;
    pointer-events: none;
  }
  .slider__tick {
    position: absolute;
    inline-size: 2px;
    block-size: 6px;
    transform: translate(-50%, 2px);
    border-radius: 1px;
    background: var(--ds-slider-tick, var(--ds-color-border, #d6d3d1));
  }
  .slider[data-orientation="horizontal"] {
    inline-size: auto;
    min-inline-size: 0;
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
