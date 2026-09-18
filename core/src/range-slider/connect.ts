import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { clampPair, percentages } from "./state";
import type { RangeSliderState } from "./types";

/** The public, framework-agnostic API for a connected range slider. */
export interface RangeSliderApi {
  value: readonly [number, number];
  min: number;
  max: number;
  step: number;
  minDistance: number;
  /** `[lowerPercentage, upperPercentage]`, each 0-100. */
  percentages: readonly [number, number];
  /** Request a new raw value for one thumb; clamped against the other and
   * snapped to the step before it is reported. */
  setValue(index: 0 | 1, raw: number): void;
  /** Props for the slider container (styling hooks). */
  rootProps: ElementProps;
  /**
   * Props for the decorative fill between the two thumbs. Carries
   * `aria-hidden`: the two real inputs are what a screen reader sees. There
   * is no equivalent `trackProps`, because the track is not a separate
   * decorative element here; the two real inputs sit inside it, so hiding it
   * would hide them too.
   */
  rangeProps: ElementProps;
  /**
   * Props for one thumb's native `<input type="range">`, everything except
   * `value` and the input handler: those two stay live DOM state, so an
   * adapter binds them directly instead of routing them through an attribute
   * sync (the same split `text-field`'s `controlProps` already makes, and
   * for the same reason: once a user has touched a control, re-setting the
   * `value` *attribute* no longer updates its live value). Read the current
   * value from `api.value[index]` and call `api.setValue(index, raw)` on
   * input instead.
   *
   * `min`/`max` are always the state's global bounds on *both* thumbs, never
   * narrowed: a native thumb renders at `(value - min) / (max - min)` of the
   * track, so narrowing one thumb's bounds while its value stays still moves
   * it on screen even though nothing the user did touched it (measured; see
   * the private spike record). The dependent bound is carried only as an
   * `aria-valuemin`/`aria-valuemax` override instead.
   */
  getThumbProps(index: 0 | 1): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: RangeSliderState;
  /** Request a new raw value for one thumb; the adapter owns how state
   * updates. */
  setValue: (index: 0 | 1, raw: number) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect range slider state to props for two native `<input type="range">`
 * elements sharing one track. The browser owns each thumb's own slider role,
 * keyboard (arrows/Page/Home/End) and pointer dragging; the headless layer
 * owns the pair as a whole: which thumb is which, the clamp that keeps them
 * from crossing, and the dependent bound each reports to assistive
 * technology.
 */
export function connect({
  state,
  setValue,
  normalize = identityNormalize,
}: ConnectOptions): RangeSliderApi {
  const { value, min, max, step, minDistance, orientation, disabled } = state;

  const set = (index: 0 | 1, raw: number) => {
    if (disabled) return;
    setValue(index, raw);
  };

  const dependentBounds = (index: 0 | 1): { min: number; max: number } =>
    index === 0 ? { min, max: value[1] - minDistance } : { min: value[0] + minDistance, max };

  return {
    value,
    min,
    max,
    step,
    minDistance,
    percentages: percentages(state),
    setValue: set,
    rootProps: normalize({
      "data-orientation": orientation,
      "data-disabled": disabled ? "" : undefined,
    }),
    rangeProps: normalize({
      "aria-hidden": "true",
    }),
    getThumbProps: (index: 0 | 1) => {
      const bounds = dependentBounds(index);
      return normalize({
        type: "range",
        min,
        max,
        step,
        disabled: disabled || undefined,
        "aria-orientation": orientation,
        "data-thumb": index === 0 ? "lower" : "upper",
        "data-orientation": orientation,
        "data-disabled": disabled ? "" : undefined,
        // Discouraged by ARIA-in-HTML on a native range input ("authors
        // should not use aria-valuemax or aria-valuemin"), and whether every
        // engine's real assistive technology honors it over the fixed native
        // min/max is unverified beyond one engine's accessibility tree (see
        // the private spike record). Kept because it is "should not," not
        // "must not," and Chromium's own tree does honor it; backed by the
        // adapter's aria-valuetext rather than relied on alone.
        "aria-valuemin": bounds.min,
        "aria-valuemax": bounds.max,
      });
    },
  };
}

export { clampPair };
