import { slider as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export type SliderApi = core.SliderApi;
export type SliderState = core.SliderState;
export type SliderOrientation = core.Orientation;

export interface UseSliderOptions {
  /** Initial (uncontrolled) or current (controlled) value. */
  value?: number;
  min?: number;
  max?: number;
  /** Step increment. Defaults to `1`. */
  step?: number;
  /** Layout and arrow-key axis. Defaults to `horizontal`. */
  orientation?: SliderOrientation;
  disabled?: boolean;
  /** Called whenever the value changes. */
  onValueChange?: (value: number) => void;
}

/**
 * Connect the headless slider to Vue. The slider is backed by a native
 * `<input type="range">`: the browser owns the slider role, ARIA value,
 * keyboard control (arrows / Page / Home / End), pointer dragging and form
 * participation; the composable owns the controlled, snapped value (mirrored by
 * a `watch`) and the filled percentage the styled track reads.
 */
export function useSlider(
  options: MaybeRefOrGetter<UseSliderOptions> = {},
): ComputedRef<SliderApi> {
  const resolved = computed(() => toValue(options));
  // One seeding pass fixes the id, so later states reuse it instead of drawing
  // a fresh one from the core's counter on every recompute.
  const seed = core.initialState(resolved.value);
  const value = ref(seed.value);

  watch(
    () => resolved.value.value,
    (next) => {
      if (next != null) value.value = next;
    },
  );

  const setValue = (next: number) => {
    if (value.value === next) return;
    value.value = next;
    resolved.value.onValueChange?.(next);
  };

  return computed(() =>
    core.connect({
      state: core.initialState({ ...resolved.value, id: seed.id, value: value.value }),
      setValue,
      normalize: normalizeProps,
    }),
  );
}
