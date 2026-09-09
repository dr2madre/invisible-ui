import { slider as core } from "@design-system/core";
import { derived, writable, type Readable } from "svelte/store";
import { stableId } from "../internal/stable-id";

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
  /**
   * Reflect a controlled `value` prop without reporting a change. The value is
   * snapped to the step, like a user action, so the consumer may hold a value
   * between two steps while the control shows the nearest one.
   */
  syncValue: (value: number) => void;
}

/**
 * Create a headless slider backed by a native `<input type="range">`. The
 * browser owns the slider role, ARIA value, keyboard, pointer dragging and form
 * participation; this adapter only owns the controlled, snapped value and the
 * filled percentage (for the styled track fill).
 */
export function createSlider(context: core.SliderContext = {}): CreateSlider {
  const state = writable<SliderState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-slider") }),
  );

  const setValue = (next: number) => {
    state.update((current) => {
      const snapped = core.snap(next, current.min, current.max, current.step);
      if (current.disabled || current.value === snapped) return current;
      context.onValueChange?.(snapped);
      return { ...current, value: snapped };
    });
  };

  // Reflecting a controlled prop snaps it the same way a user action would,
  // so the control never shows a value it could not reach. A value that is
  // not a number is not a position on the track: it is ignored, and the
  // control keeps the last one it could show.
  const syncValue = (next: number) =>
    state.update((current) => {
      if (!Number.isFinite(next)) return current;
      const snapped = core.snap(next, current.min, current.max, current.step);
      return current.value === snapped ? current : { ...current, value: snapped };
    });

  return {
    state,
    value: derived(state, ($state) => $state.value),
    percentage: derived(state, ($state) => core.percentage($state)),
    setValue,
    syncValue,
  };
}
