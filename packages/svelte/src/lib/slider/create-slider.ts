import { slider as core } from "@design-system/core";
import { derived, writable, type Readable } from "svelte/store";

export type SliderApi = core.SliderApi;
export type SliderState = core.SliderState;
export type SliderContext = core.SliderContext;

export interface CreateSlider {
  /** Reactive resolved state. */
  state: Readable<SliderState>;
  /** Current value. */
  value: Readable<number>;
  /** Filled fraction as a 0–100 percentage. */
  percentage: Readable<number>;
  /** Set the value (snapped + clamped; ignored while disabled). */
  setValue: (value: number) => void;
}

/**
 * Create a headless slider backed by a native `<input type="range">`. The
 * browser owns the slider role, ARIA value, keyboard, pointer dragging and form
 * participation; this adapter only owns the controlled, snapped value and the
 * filled percentage (for the styled track fill).
 */
export function createSlider(context: core.SliderContext = {}): CreateSlider {
  const state = writable<SliderState>(core.initialState(context));

  const setValue = (next: number) => {
    state.update((current) => {
      const snapped = core.snap(next, current.min, current.max, current.step);
      if (current.disabled || current.value === snapped) return current;
      context.onValueChange?.(snapped);
      return { ...current, value: snapped };
    });
  };

  return {
    state,
    value: derived(state, ($state) => $state.value),
    percentage: derived(state, ($state) => core.percentage($state)),
    setValue,
  };
}
