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
  import { untrack, type Snippet } from "svelte";
  import { createRangeSlider } from "./create-range-slider";
  import { nearestThumb } from "./nearest-thumb";
  import { formReset } from "../internal/form-reset";
  import { controllable } from "../internal/controllable.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { rangeSlider as core } from "@design-system/core";

  const { t } = getI18n();

  interface Props {
    value?: readonly [number, number];
    min?: number;
    max?: number;
    step?: number;
    /** The gap the two thumbs may not close. They may touch; they never cross. */
    minDistance?: number;
    orientation?: "horizontal" | "vertical";
    disabled?: boolean;
    /** Accessible name for the group. */
    label: string;
    /** Accessible name for each thumb: `[lowerLabel, upperLabel]`. */
    thumbLabels: readonly [string, string];
    /** Form field name — both thumbs submit under it, in order:
     * `FormData.getAll(name)` reads `[String(lower), String(upper)]`. */
    name?: string;
    /** Show the current values to the side of the track. */
    showValue?: boolean;
    /** Show the min and max reference values under the ends of the track. */
    showRange?: boolean;
    /** Show tick marks at each step (only when the count is reasonable). */
    ticks?: boolean;
    /** Format a displayed value (e.g. add a unit). */
    format?: (value: number) => string;
    /** Called with the complete pair whenever it changes. */
    onValueChange?: (value: readonly [number, number]) => void;
    /** A decorative icon before the track. */
    icon?: Snippet;
  }

  let {
    value = $bindable([0, 100]),
    min = 0,
    max = 100,
    step = 1,
    minDistance = 0,
    orientation = "horizontal",
    disabled = false,
    label,
    thumbLabels,
    name,
    showValue = false,
    showRange = false,
    ticks = false,
    format = (v) => String(v),
    onValueChange,
    icon,
  }: Props = $props();

  // Seeded once from the first props; the mirror and the effects below follow
  // later ones. A live callback reference, so a swapped callback is honoured
  // (ADR 0011).
  const {
    api,
    value: pairValue,
    percentages,
    setValue,
    syncValue,
    syncConfig,
  } = untrack(() =>
    createRangeSlider({
      value,
      min,
      max,
      step,
      minDistance,
      orientation,
      disabled,
      onValueChange: (next) => onValueChange?.(next),
    }),
  );

  // The pair is compared by position, never by reference: a fresh array
  // holding the same two numbers is no change.
  let seenPair = untrack(() => value);
  const samePair = (next: readonly [number, number]) => {
    if (next[0] !== seenPair[0] || next[1] !== seenPair[1]) seenPair = next;
    return seenPair;
  };

  // Controllable mirror, atomic across both positions (ADR 0011): a pair
  // matching what the control itself last reported in only one position is
  // not a give-back, and is taken as the application's own choice.
  const mirror = controllable({
    get: () => samePair(value),
    set: (next) => (value = next),
    reflect: syncValue,
    isGiveBack: (next) => next[0] === $pairValue[0] && next[1] === $pairValue[1],
  });

  // Constraints changed after mount reach the machine, the DOM and the
  // dependent bounds without a remount, and report nothing.
  $effect.pre(() => {
    syncConfig({ min, max, step, minDistance, orientation, disabled });
  });

  // The reset default (ADR 0012), normalized the same way a user's own drag
  // would be, so a native reset can never restore an invalid pair. A new
  // default is normalized once against the constraints of its time; a later
  // constraint change normalizes the held default again.
  let defaultValue = $state.raw(
    untrack(() => core.normalizePair(value, min, max, step, minDistance)),
  );
  $effect.pre(() => {
    const next = mirror.defaultValue;
    untrack(() => {
      defaultValue = core.normalizePair(next, min, max, step, minDistance);
    });
  });
  $effect.pre(() => {
    const constraints = [min, max, step, minDistance] as const;
    defaultValue = core.normalizePair(
      untrack(() => defaultValue),
      ...constraints,
    );
  });
  // The restore puts the control's own copy back beside the machine's, so a
  // later prop change is judged against what the page now shows (ADR 0012).
  const restore = () => {
    const pair = defaultValue;
    mirror.write(pair);
    syncValue(pair);
  };

  function onInput(index: 0 | 1) {
    return (event: Event) => {
      const input = event.currentTarget as HTMLInputElement;
      setValue(index, Number(input.value));
      // A request the clamp refuses changes no state, so nothing re-renders,
      // and the native input would stay where the user pushed it, past the
      // bound. It is put back by hand.
      const held = String($pairValue[index]);
      if (input.value !== held) input.value = held;
    };
  }

  let lowerEl: HTMLInputElement | null = $state(null);
  let upperEl: HTMLInputElement | null = $state(null);
  let trackEl: HTMLElement | undefined;

  // Tick positions (as %), one per grid point the arrows can reach, shown
  // only for a sane number of steps. Spaced by the step, not by dividing the
  // span: a max the grid does not reach (0-95 on a step of 10) has no tick.
  const tickCount = $derived(step > 0 ? Math.floor((max - min) / step) : 0);
  const tickPositions = $derived(
    ticks && tickCount > 0 && tickCount <= 20
      ? Array.from({ length: tickCount + 1 }, (_, i) => ((i * step) / (max - min)) * 100)
      : [],
  );

  // The bound named is the one the clamp really uses, read from the same
  // override core computes, so the text and the attribute never disagree.
  const lowerAriaText = $derived(
    $t("rangeSlider.lowerText", {
      value: format($pairValue[0]),
      bound: format(Number($api.getThumbProps(0)["aria-valuemax"])),
    }),
  );
  const upperAriaText = $derived(
    $t("rangeSlider.upperText", {
      value: format($pairValue[1]),
      bound: format(Number($api.getThumbProps(1)["aria-valuemin"])),
    }),
  );
</script>

<div
  class={["range-slider-field", disabled && "range-slider-field--disabled"]}
  data-orientation={orientation}
>
  <div class="range-slider-field__row">
    {#if icon}
      <span class="range-slider-field__icon" aria-hidden="true">{@render icon()}</span>
    {/if}
    <div
      class={["range-slider", disabled && "range-slider--disabled"]}
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
          oninput={onInput(0)}
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
          oninput={onInput(1)}
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
    /* The thumbs are raised with inline z-index; kept inside this box so they
       never paint over a later positioned sibling of the control. */
    isolation: isolate;
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
    /* Its own token: the horizontal length is the field's width, a value
       that may be a percentage, which an upright track has nothing to
       resolve against. */
    block-size: var(--ds-range-slider-vertical-length, 12rem);
  }
  .range-slider-field[data-orientation="vertical"],
  .range-slider[data-orientation="vertical"] {
    /* Upright, the control is as wide as its track and label, not its row. */
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
  /* Upright, a tick sits at its grid point from the bottom, like the fill. */
  .range-slider[data-orientation="vertical"] .range-slider__tick {
    inset-inline-start: 50%;
    inset-block-start: auto;
    inset-block-end: var(--_tick-pct);
    transform: translate(-50%, 50%);
  }
  .range-slider-field--disabled {
    opacity: 0.5;
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
