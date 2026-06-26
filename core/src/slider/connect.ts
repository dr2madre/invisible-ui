import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { percentage, snap } from "./state";
import type { SliderState } from "./types";

/** The public, framework-agnostic API for a connected slider. */
export interface SliderApi {
  value: number;
  min: number;
  max: number;
  step: number;
  /** Filled fraction as a 0–100 percentage. */
  percentage: number;
  /** Set the value (snapped + clamped; ignored while disabled). */
  setValue(value: number): void;
  /** Props for the slider container (styling hooks). */
  rootProps: ElementProps;
  /**
   * Props for a native `<input type="range">`. The browser owns the slider
   * role, ARIA value, keyboard control, pointer dragging and form participation;
   * the live `value` is a DOM property, so adapters bind it directly.
   */
  inputProps: ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: SliderState;
  /** Request a new value; the adapter owns how state updates. */
  setValue: (value: number) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect slider state to props for a native `<input type="range">`. The browser
 * owns the slider role, ARIA value, keyboard (arrows/Page/Home/End), pointer
 * dragging and form participation; the headless layer only owns the controlled,
 * snapped value and the filled percentage.
 */
export function connect({
  state,
  setValue,
  normalize = identityNormalize,
}: ConnectOptions): SliderApi {
  const { value, min, max, step, orientation, disabled } = state;

  const set = (next: number) => {
    if (disabled) return;
    setValue(snap(next, min, max, step));
  };

  return {
    value,
    min,
    max,
    step,
    percentage: percentage(state),
    setValue: set,
    rootProps: normalize({
      "data-orientation": orientation,
      "data-disabled": disabled ? "" : undefined,
    }),
    inputProps: normalize({
      type: "range",
      min,
      max,
      step,
      disabled: disabled || undefined,
      "aria-orientation": orientation,
      "data-orientation": orientation,
      "data-disabled": disabled ? "" : undefined,
      onInput: (event: Event) => set(Number((event.target as HTMLInputElement).value)),
    }),
  };
}
