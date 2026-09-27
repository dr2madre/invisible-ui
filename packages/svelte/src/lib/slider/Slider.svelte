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
  import { untrack, type Snippet } from "svelte";
  import { createSlider } from "./create-slider";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";

  interface Props {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    orientation?: "horizontal" | "vertical";
    disabled?: boolean;
    /** Accessible name for the slider. */
    label: string;
    /** Form field name — the value is submitted under it. */
    name?: string;
    /** Show the current value to the side of the track. */
    showValue?: boolean;
    /** Show the min and max reference values under the ends of the track. */
    showRange?: boolean;
    /** Show tick marks at each step (only when the count is reasonable). */
    ticks?: boolean;
    /** Format the displayed value/range (e.g. add a unit). */
    format?: (value: number) => string;
    /** Called whenever the value changes. */
    onValueChange?: (value: number) => void;
    /** A decorative icon before the track. */
    icon?: Snippet;
  }

  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    orientation = "horizontal",
    disabled = false,
    label,
    name,
    showValue = false,
    showRange = false,
    ticks = false,
    format = (v) => String(v),
    onValueChange,
    icon,
  }: Props = $props();

  // Seeded once from the first props; the effects below follow later ones.
  // A live callback reference, so a swapped callback is honoured (ADR 0011).
  const {
    value: sliderValue,
    percentage,
    setValue,
    syncValue,
    syncConfig,
  } = untrack(() =>
    createSlider({
      value,
      min,
      max,
      step,
      orientation,
      disabled,
      onValueChange: (next) => onValueChange?.(next),
    }),
  );

  // Constraints changed after mount reach the machine without a remount, and
  // report nothing. Declared before the value mirror, so a value and bounds
  // changed together are judged against the new bounds.
  $effect.pre(() => {
    syncConfig({ min, max, step, orientation, disabled });
  });

  // Controllable mirror (ADR 0011), with the reset default of ADR 0012.
  const mirror = controllable({
    get: () => value,
    set: (next) => (value = next),
    reflect: syncValue,
    isGiveBack: (next) => next === $sliderValue,
  });

  function onInput(event: Event) {
    setValue(Number((event.currentTarget as HTMLInputElement).value));
  }

  // Tick positions (as %), shown only for a sane number of steps.
  const tickCount = $derived(step > 0 ? Math.round((max - min) / step) : 0);
  const tickPositions = $derived(
    ticks && tickCount > 0 && tickCount <= 20
      ? Array.from({ length: tickCount + 1 }, (_, i) => (i / tickCount) * 100)
      : [],
  );
</script>

<div class={["slider-field", disabled && "slider-field--disabled"]}>
  <div class="slider-field__row">
    {#if icon}
      <span class="slider-field__icon" aria-hidden="true">{@render icon()}</span>
    {/if}
    <span
      class={["slider", disabled && "slider--disabled"]}
      data-orientation={orientation}
      style="--_slider-pct: {$percentage}%"
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
        defaultValue={mirror.defaultValue}
        oninput={onInput}
        use:formReset={mirror.restore}
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
    color: var(--ds-color-text-secondary, #524c44);
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
    color: var(--ds-color-text, #282420);
  }
  .slider-field__range {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--ds-color-text-secondary, #524c44);
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
    background: var(--ds-slider-tick, var(--ds-color-border, #c7c1b7));
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
      var(--ds-slider-range, var(--ds-color-secondary, #7a52cc)) var(--_slider-pct, 0%),
      var(--ds-slider-track, var(--ds-color-border, #c7c1b7)) var(--_slider-pct, 0%)
    );
  }
  .slider[data-orientation="vertical"] .slider__input::-webkit-slider-runnable-track {
    inline-size: var(--ds-slider-thickness, 0.375rem);
    background: linear-gradient(
      to top,
      var(--ds-slider-range, var(--ds-color-secondary, #7a52cc)) var(--_slider-pct, 0%),
      var(--ds-slider-track, var(--ds-color-border, #c7c1b7)) var(--_slider-pct, 0%)
    );
  }
  .slider__input::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    inline-size: var(--ds-slider-thumb-size, 1rem);
    block-size: var(--ds-slider-thumb-size, 1rem);
    border-radius: 999px;
    background: var(--ds-slider-thumb, var(--ds-color-background, #fff));
    border: 2px solid var(--ds-slider-range, var(--ds-color-secondary, #7a52cc));
    /* Center the thumb on the track. */
    margin-block-start: calc(
      (var(--ds-slider-thickness, 0.375rem) - var(--ds-slider-thumb-size, 1rem)) / 2
    );
  }

  /* Firefox: a track plus a native progress fill. */
  .slider__input::-moz-range-track {
    block-size: var(--ds-slider-thickness, 0.375rem);
    border-radius: 999px;
    background: var(--ds-slider-track, var(--ds-color-border, #c7c1b7));
  }
  .slider__input::-moz-range-progress {
    block-size: var(--ds-slider-thickness, 0.375rem);
    border-radius: 999px;
    background: var(--ds-slider-range, var(--ds-color-secondary, #7a52cc));
  }
  .slider__input::-moz-range-thumb {
    inline-size: var(--ds-slider-thumb-size, 1rem);
    block-size: var(--ds-slider-thumb-size, 1rem);
    border-radius: 999px;
    background: var(--ds-slider-thumb, var(--ds-color-background, #fff));
    border: 2px solid var(--ds-slider-range, var(--ds-color-secondary, #7a52cc));
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
  /* Forced colors drops every fill and every shadow. The ring the theme
     forces on the input is what remains of the focus indicator, surrounding
     the whole control like the native one, and the track and thumb take
     borders so the control itself does not vanish. */
  @media (forced-colors: active) {
    /* The control carries a boundary of its own as well: its track and thumb
       are pseudo-elements, which nothing outside the browser can inspect. */
    .slider__input {
      border: 1px solid CanvasText;
    }
    .slider__input::-webkit-slider-runnable-track {
      border: 1px solid CanvasText;
    }
    .slider__input::-webkit-slider-thumb {
      border-color: CanvasText;
      background: Highlight;
    }
    .slider__input::-moz-range-track {
      border: 1px solid CanvasText;
    }
    .slider__input::-moz-range-thumb {
      border-color: CanvasText;
      background: Highlight;
    }
  }
</style>
