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
  const resolved = computed(() => toValue(options));
  const seed = core.initialState({ ...resolved.value, id: useStableId("ds-range-slider") });
  const value = ref<readonly [number, number]>(seed.value);

  watch(
    () => resolved.value.value,
    (next) => {
      if (next != null) value.value = next;
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
