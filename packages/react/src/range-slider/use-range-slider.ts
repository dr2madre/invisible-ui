import { rangeSlider as core } from "@design-system/core";
import { useId, useMemo, useRef, type RefObject } from "react";
import { useFormDefault, useResettable } from "../internal/form-reset";
import { normalizeProps } from "../normalize";

export type RangeSliderOrientation = core.Orientation;
export type RangeValue = readonly [number, number];

export interface UseRangeSliderOptions {
  /** Initial (uncontrolled) or current (controlled) value. */
  value?: RangeValue;
  min?: number;
  max?: number;
  step?: number;
  /** The gap the two thumbs may not close. They may touch; they never cross. */
  minDistance?: number;
  orientation?: RangeSliderOrientation;
  disabled?: boolean;
  /** Called with the complete pair whenever it changes. */
  onValueChange?: (value: RangeValue) => void;
  /**
   * The two native range inputs, lower first. Given them, they carry the DOM
   * defaults a form reset restores, and the pair is put back as a whole when
   * their form is reset, silently (ADR 0012).
   */
  thumbRefs?: readonly [RefObject<HTMLInputElement | null>, RefObject<HTMLInputElement | null>];
}

const FULL: RangeValue = [0, 100];

const samePair = (a: RangeValue, b: RangeValue): boolean => a[0] === b[0] && a[1] === b[1];

/**
 * Connect the headless range slider to React. Backed by two native
 * `<input type="range">` elements: the browser owns each thumb's own slider
 * role, ARIA value, keyboard control and pointer dragging; the hook owns the
 * pair as a whole, clamped so the thumbs never cross and reported once per
 * real change. Bind `api.value[i]` to each input and call
 * `api.setValue(i, Number(event.currentTarget.value))` from its `onChange`.
 */
export function useRangeSlider({
  value = FULL,
  min: minProp = 0,
  max: maxProp = 100,
  step = 1,
  minDistance = 0,
  orientation,
  disabled,
  onValueChange,
  thumbRefs,
}: UseRangeSliderOptions = {}): core.RangeSliderApi {
  const id = `ds-range-slider-${useId()}`;
  // Reversed bounds read the smaller number as `min`, as the core does; every
  // clamp below assumes `min <= max`.
  const [min, max] = core.orderBounds(minProp, maxProp);
  // The pair the current constraints allow: a user's drag, a controlled value
  // and a reset default all go through it, so none can hold a pair the thumbs
  // could not reach. Normalizing reports nothing: a constraint is the
  // application's data, not a user action.
  const normalize = (pair: RangeValue) => core.normalizePair(pair, min, max, step, minDistance);

  const own = useRef<HTMLInputElement | null>(null);
  const [lower, upper] = thumbRefs ?? [own, own];
  // A pair matching what the control holds in only one position is not a
  // give-back: it is compared as a whole (ADR 0012). One reset anchor is
  // enough: the reset event is form-wide, and the restore puts the whole pair
  // back at once.
  const [held, setHeld, given] = useResettable(value, undefined, lower, samePair);
  const pair = normalize(held);
  const defaultValue = normalize(given);
  // React keeps a controlled input's `value` attribute in step with what it
  // renders, so the defaults are written back after every render.
  useFormDefault(lower, (node: HTMLInputElement) => {
    node.defaultValue = String(defaultValue[0]);
  });
  useFormDefault(upper, (node: HTMLInputElement) => {
    node.defaultValue = String(defaultValue[1]);
  });

  const [lo, hi] = pair;
  return useMemo(() => {
    const current: RangeValue = [lo, hi];
    return core.connect({
      state: core.initialState({
        value: current,
        min,
        max,
        step,
        minDistance,
        orientation,
        disabled,
        id,
      }),
      setValue: (index, raw) => {
        const next = core.clampPair(current, index, raw, min, max, step, minDistance);
        if (samePair(next, current)) return;
        setHeld(next);
        onValueChange?.(next);
      },
      normalize: normalizeProps,
    });
  }, [lo, hi, min, max, step, minDistance, orientation, disabled, id, onValueChange, setHeld]);
}
