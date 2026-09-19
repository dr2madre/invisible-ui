import { rangeSlider as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type RangeSliderApi = core.RangeSliderApi;
export type RangeSliderOrientation = core.Orientation;

export interface UseRangeSliderOptions {
  /** Initial (uncontrolled) or current (controlled) value. */
  value?: readonly [number, number];
  min?: number;
  max?: number;
  step?: number;
  /** The gap the two thumbs may not close. They may touch; they never cross. */
  minDistance?: number;
  orientation?: RangeSliderOrientation;
  disabled?: boolean;
  /** Called with the complete pair whenever it changes. */
  onValueChange?: (value: readonly [number, number]) => void;
}

/**
 * Connect the headless range slider to Vue. Backed by two native
 * `<input type="range">` elements: the browser owns each thumb's own slider
 * role, ARIA value, keyboard control and pointer dragging; the composable
 * owns the pair as a whole, clamped so the thumbs never cross and reported
 * exactly once per real change.
 *
 * Give-back and form-reset defaults are not this composable's job: they
 * depend on comparing an incoming value against what the control itself last
 * reported, atomically across both positions, which only the component
 * (holding the `v-model` prop) can do — the same split `Slider`/`use-slider`
 * already make.
 */
export function useRangeSlider(
  options: MaybeRefOrGetter<UseRangeSliderOptions> = {},
): ComputedRef<RangeSliderApi> {
  // Reversed bounds read the smaller number as `min`, the same way core and
  // the Svelte adapter do; every clamp below assumes `min <= max`.
  const resolved = computed(() => {
    const given = toValue(options);
    const [min, max] = core.orderBounds(given.min ?? 0, given.max ?? 100);
    return { ...given, min, max };
  });
  const seed = core.initialState({ ...resolved.value, id: useStableId("ds-range-slider") });
  const value = ref<readonly [number, number]>(seed.value);

  // A controlled value is normalized here, on purpose, not as a side effect
  // of the constraint watch below re-running: the clamp reads this pair, and
  // a raw [90, 10] would clamp a drag against a bound that is upside down.
  watch(
    () => resolved.value.value,
    (next) => {
      if (next == null) return;
      const r = resolved.value;
      value.value = core.normalizePair(
        next,
        r.min ?? 0,
        r.max ?? 100,
        r.step ?? 1,
        r.minDistance ?? 0,
      );
    },
  );

  // A constraint that changed after mount can leave the held pair invalid;
  // it is normalized silently, as a drag would have been, so the clamp never
  // reads a pair the new constraints would not allow. Nothing is reported: a
  // constraint is the application's data, not a user action.
  // One source per constraint: a getter returning a fresh array would fire on
  // every option change, value included, and hide a value the watch above
  // failed to normalize.
  watch(
    [
      () => resolved.value.min,
      () => resolved.value.max,
      () => resolved.value.step,
      () => resolved.value.minDistance,
    ],
    ([min, max, step, minDistance]) => {
      const next = core.normalizePair(
        value.value,
        min ?? 0,
        max ?? 100,
        step ?? 1,
        minDistance ?? 0,
      );
      if (next[0] !== value.value[0] || next[1] !== value.value[1]) value.value = next;
    },
  );

  const setValue = (index: 0 | 1, raw: number) => {
    const current = resolved.value;
    const next = core.clampPair(
      value.value,
      index,
      raw,
      current.min ?? 0,
      current.max ?? 100,
      current.step ?? 1,
      current.minDistance ?? 0,
    );
    if (next[0] === value.value[0] && next[1] === value.value[1]) return;
    value.value = next;
    current.onValueChange?.(next);
  };

  return computed(() =>
    core.connect({
      state: core.initialState({ ...resolved.value, id: seed.id, value: value.value }),
      setValue,
      normalize: normalizeProps,
    }),
  );
}
