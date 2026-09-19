<script lang="ts">
  /**
   * RangeSlider — a styled two-thumb slider built on two **native**
   * `<input type="range">` elements sharing one track. The browser provides
   * each thumb's own slider role, ARIA value, keyboard control (arrows / Page
   * / Home / End), pointer dragging, focus and form participation; this layer
   * styles the track, the fill between the thumbs and the two thumbs, and
   * keeps them from crossing.
   *
   * A separate component from `Slider`, not a mode on it: the value is a
   * pair, and every operation (the clamp, the dependent bound, reporting)
   * works on the pair as a whole.
   *
   * Provide `label` for the group's accessible name and `thumbLabels` for
   * each thumb's own name — there is no universal word for "the lower one" to
   * fall back to. Colors, sizing and the thumbs are themeable via
   * `--ds-range-slider-*`.
   */
  import { createRangeSlider } from "./create-range-slider";
  import { nearestThumb } from "./nearest-thumb";
  import { formReset } from "../internal/form-reset";
  import { getI18n } from "../i18n/create-i18n";
  import { rangeSlider as core } from "@design-system/core";

  const { t } = getI18n();

  export let value: readonly [number, number] = [0, 100];
  export let min = 0;
  export let max = 100;
  export let step = 1;
  /** The gap the two thumbs may not close. They may touch; they never cross. */
  export let minDistance = 0;
  export let orientation: "horizontal" | "vertical" = "horizontal";
  export let disabled = false;
  /** Accessible name for the group. */
  export let label: string;
  /** Accessible name for each thumb: `[lowerLabel, upperLabel]`. */
  export let thumbLabels: readonly [string, string];
  /** Form field name — both thumbs submit under it, in order:
   * `FormData.getAll(name)` reads `[String(lower), String(upper)]`. */
  export let name: string | undefined = undefined;
  /** Show the current values to the side of the track. */
  export let showValue = false;
  /** Show the min and max reference values under the ends of the track. */
  export let showRange = false;
  /** Show tick marks at each step (only when the count is reasonable). */
  export let ticks = false;
  /** Format a displayed value (e.g. add a unit). */
  export let format: (value: number) => string = (v) => String(v);
  /** Called with the complete pair whenever it changes. */
  export let onValueChange: ((value: readonly [number, number]) => void) | undefined = undefined;

  // A live callback reference, so a swapped callback is honoured (ADR 0011).
  const {
    api,
    value: pairValue,
    percentages,
    setValue,
    syncValue,
    syncConfig,
  } = createRangeSlider({
    value,
    min,
    max,
    step,
    minDistance,
    orientation,
    disabled,
    onValueChange: (next) => onValueChange?.(next),
  });

  // Controllable mirror, atomic across both positions (ADR 0011): a pair
  // matching what the control itself last reported in only one position is
  // not a give-back, and is taken as the application's own choice.
  let lastValue = value;
  // The reset default follows the prop, except a give-back of what the
  // control itself reported (ADR 0012). Normalized the same way a user's own
  // drag would be, so a native reset can never restore an invalid pair.
  let defaultValue = core.normalizePair(value, min, max, step, minDistance);
  $: if (value[0] !== lastValue[0] || value[1] !== lastValue[1]) {
    lastValue = value;
    const isGiveBack = value[0] === $pairValue[0] && value[1] === $pairValue[1];
    if (!isGiveBack) defaultValue = core.normalizePair(value, min, max, step, minDistance);
    syncValue(value);
  }
  // Constraints changed after mount reach the machine, the DOM and the
  // dependent bounds without a remount, and report nothing. The reset
  // default is normalized against them too, so a native reset can never put
  // back a pair the new constraints would not allow.
  $: syncConfig({ min, max, step, minDistance, orientation, disabled });
  $: defaultValue = core.normalizePair(defaultValue, min, max, step, minDistance);
  // The restore puts the control's own copy back beside the machine's, so a
  // later prop change is judged against what the page now shows (ADR 0012).
  const restore = () => {
    lastValue = defaultValue;
    value = defaultValue;
    syncValue(defaultValue);
  };

  function onInput(index: 0 | 1) {
    return (event: Event) =>
      setValue(index, Number((event.currentTarget as HTMLInputElement).value));
  }

  let lowerEl: HTMLInputElement | null = null;
  let upperEl: HTMLInputElement | null = null;
  let trackEl: HTMLElement;

  // Tick positions (as %), shown only for a sane number of steps.
  $: tickCount = step > 0 ? Math.round((max - min) / step) : 0;
  $: tickPositions =
    ticks && tickCount > 0 && tickCount <= 20
      ? Array.from({ length: tickCount + 1 }, (_, i) => (i / tickCount) * 100)
      : [];

  // The bound named is the one the clamp really uses: the effective distance,
  // rounded up to the step grid and capped at the span.
  $: lowerAriaText = $t("rangeSlider.lowerText", {
    value: format($pairValue[0]),
    bound: format($pairValue[1] - $api.minDistance),
  });
  $: upperAriaText = $t("rangeSlider.upperText", {
    value: format($pairValue[1]),
    bound: format($pairValue[0] + $api.minDistance),
  });
</script>

<div
  class="range-slider-field"
  class:range-slider-field--disabled={disabled}
  data-orientation={orientation}
>
  <div class="range-slider-field__row">
    {#if $$slots.icon}
      <span class="range-slider-field__icon" aria-hidden="true"><slot name="icon" /></span>
    {/if}
    <div
      class="range-slider"
      class:range-slider--disabled={disabled}
      aria-label={label}
      role="group"
      data-orientation={orientation}
      style="--_range-lower-pct: {$percentages[0]}%; --_range-upper-pct: {$percentages[1]}%"
      {...$api.rootProps}
    >
      <div
        class="range-slider__track"
        bind:this={trackEl}
        use:nearestThumb={{ lower: lowerEl, upper: upperEl, value: $pairValue, orientation }}
      >
        <span class="range-slider__range" {...$api.rangeProps}></span>
        {#if tickPositions.length}
          <span class="range-slider__ticks" aria-hidden="true">
            {#each tickPositions as pos (pos)}
              <span class="range-slider__tick" style="--_tick-pct: {pos}%"></span>
            {/each}
          </span>
        {/if}
        <input
          {...$api.getThumbProps(0)}
          bind:this={lowerEl}
          class="range-slider__input"
          {name}
          aria-label={thumbLabels[0]}
          aria-valuetext={lowerAriaText}
          value={$pairValue[0]}
          defaultValue={defaultValue[0]}
          on:input={onInput(0)}
          use:formReset={restore}
        />
        <input
          {...$api.getThumbProps(1)}
          bind:this={upperEl}
          class="range-slider__input"
          {name}
          aria-label={thumbLabels[1]}
          aria-valuetext={upperAriaText}
          value={$pairValue[1]}
          defaultValue={defaultValue[1]}
          on:input={onInput(1)}
        />
      </div>
    </div>
    {#if showValue}
      <output class="range-slider-field__value"
        >{format($pairValue[0])} – {format($pairValue[1])}</output
      >
    {/if}
  </div>
  {#if showRange}
    <div class="range-slider-field__range" aria-hidden="true">
      <span>{format(min)}</span>
      <span>{format(max)}</span>
    </div>
  {/if}
</div>

<style>
  .range-slider-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    /* A definite length, so the track still has room where the container
       sizes itself to its content; capped so a narrower one still fits.
       Set --ds-range-slider-length to 100% to fill instead. */
    inline-size: var(--ds-range-slider-length, 14rem);
    max-inline-size: 100%;
  }
  .range-slider-field__row {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }
  .range-slider-field__icon {
    display: inline-flex;
    flex: none;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .range-slider-field__icon :global(svg) {
    inline-size: 1.2em;
    block-size: 1.2em;
  }
  .range-slider-field__value {
    flex: none;
    text-align: end;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    font-size: 0.875rem;
    color: var(--ds-color-text, #282420);
  }
  .range-slider-field__range {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .range-slider {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    inline-size: 100%;
    min-inline-size: 0;
  }
  .range-slider__track {
    position: relative;
    flex: 1;
    /* A flex item refuses to shrink past its content by default, which would
       push the whole control wider than a narrow container. */
    min-inline-size: 0;
    block-size: var(--ds-range-slider-track-size, 4px);
    border-radius: var(--ds-radius-control, 999px);
    background: var(--ds-color-border, #c7c1b7);
  }
  .range-slider[data-orientation="vertical"] .range-slider__track {
    /* The row's `flex: 1` would grow the track to the row's width; upright it
       is a thin bar, and the thumbs' height is what needs the room. */
    flex: none;
    inline-size: var(--ds-range-slider-track-size, 4px);
    block-size: var(--ds-range-slider-length, 12rem);
  }
  .range-slider-field[data-orientation="vertical"] {
    inline-size: auto;
  }
  .range-slider__range {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--_range-lower-pct);
    inline-size: calc(var(--_range-upper-pct) - var(--_range-lower-pct));
    background: var(--ds-color-primary, #7a52cc);
    border-radius: inherit;
    pointer-events: none;
  }
  .range-slider[data-orientation="vertical"] .range-slider__range {
    inset-inline: 0;
    inset-block-start: auto;
    inset-block-end: var(--_range-lower-pct);
    block-size: calc(var(--_range-upper-pct) - var(--_range-lower-pct));
    inline-size: auto;
  }
  .range-slider__input {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 50%;
    transform: translateY(-50%);
    inline-size: 100%;
    /* The thumb is the pointer target, and the input's own box is what a
       target-size check measures: engines do not all grow a range input
       around its thumb, so the thickness is stated. */
    block-size: var(--ds-range-slider-thumb-size, 1.5rem);
    margin: 0;
    background: transparent;
    appearance: none;
    -webkit-appearance: none;
    pointer-events: none;
    cursor: pointer;
  }
  .range-slider[data-orientation="vertical"] .range-slider__input {
    writing-mode: vertical-lr;
    direction: rtl;
    /* Physical properties on purpose: a logical inset or size on this element
       resolves in its own writing mode, which is now vertical, so
       `inline-size` would be its height and `inset-block-start` its left. */
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: var(--ds-range-slider-thumb-size, 1.5rem);
    height: 100%;
  }
  /* 1.5rem is 24px: the smallest pointer target WCAG 2.2 accepts, and the
     thumb is the only thing a drag can grab. */
  .range-slider__input::-webkit-slider-thumb {
    -webkit-appearance: none;
    pointer-events: auto;
    inline-size: var(--ds-range-slider-thumb-size, 1.5rem);
    block-size: var(--ds-range-slider-thumb-size, 1.5rem);
    border-radius: 50%;
    background: var(--ds-color-primary, #7a52cc);
    border: 2px solid var(--ds-color-background, #fff);
    cursor: pointer;
  }
  .range-slider__input::-moz-range-thumb {
    pointer-events: auto;
    inline-size: var(--ds-range-slider-thumb-size, 1.5rem);
    block-size: var(--ds-range-slider-thumb-size, 1.5rem);
    border-radius: 50%;
    background: var(--ds-color-primary, #7a52cc);
    border: 2px solid var(--ds-color-background, #fff);
    cursor: pointer;
  }
  .range-slider__input::-webkit-slider-runnable-track,
  .range-slider__input::-moz-range-track {
    background: transparent;
  }
  .range-slider__input:focus-visible::-webkit-slider-thumb {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #8e6cd4));
  }
  .range-slider__input:focus-visible::-moz-range-thumb {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #8e6cd4));
  }
  .range-slider--disabled .range-slider__input {
    cursor: not-allowed;
  }
  .range-slider__ticks {
    position: absolute;
    inset: 0;
  }
  .range-slider__tick {
    position: absolute;
    inset-inline-start: var(--_tick-pct);
    inset-block-start: 50%;
    inline-size: 2px;
    block-size: 2px;
    border-radius: 50%;
    background: var(--ds-color-background, #fff);
    transform: translate(-50%, -50%);
  }
  /* Forced colors drops every fill and every shadow. The ring the theme
     forces on each thumb is what remains of its focus indicator, and the
     track and thumb take borders so neither vanishes. */
  @media (forced-colors: active) {
    /* Each thumb carries a boundary of its own too: its native track and
       thumb are pseudo-elements, which nothing outside the browser can
       inspect. */
    .range-slider__input {
      border: 1px solid CanvasText;
    }
    .range-slider__input::-webkit-slider-runnable-track {
      border: 1px solid CanvasText;
    }
    .range-slider__input::-webkit-slider-thumb {
      border-color: CanvasText;
      background: Highlight;
    }
    .range-slider__input::-moz-range-track {
      border: 1px solid CanvasText;
    }
    .range-slider__input::-moz-range-thumb {
      border-color: CanvasText;
      background: Highlight;
    }
  }
</style>
