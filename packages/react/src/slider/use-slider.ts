import { slider as core } from "@design-system/core";
import { useId, useMemo, useRef, useState, type RefObject } from "react";
import { useControlledDefault, useFormDefault, useFormReset } from "../internal/form-reset";
import { inputEvent, normalizeProps } from "../normalize";

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
  /**
   * The native range input. Given it, the control carries the DOM default a
   * form reset restores, and puts its own value back when its form is reset,
   * silently (ADR 0012).
   */
  controlRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Connect the headless slider to React. The slider is backed by a native
 * `<input type="range">`: the browser owns the slider role, ARIA value,
 * keyboard control (arrows / Page / Home / End), pointer dragging and form
 * participation; the hook owns the controlled value, snapped to the step and
 * the bounds of the current render, and the filled percentage the styled track
 * reads. Bind `api.value` to the input next to `api.inputProps`.
 */
export function useSlider({
  value = 0,
  min,
  max,
  step,
  orientation,
  disabled,
  onValueChange,
  controlRef,
}: UseSliderOptions = {}): core.SliderApi {
  const id = `ds-slider-${useId()}`;
  const ownRef = useRef<HTMLInputElement | null>(null);
  const anchor = controlRef ?? ownRef;
  const [held, setHeld] = useState(value);
  // A value that is not a number is not a position on the track: it is
  // ignored, and the control keeps the last one it could show.
  const defaultValue = useControlledDefault(value, held, (next) => {
    if (Number.isFinite(next)) setHeld(next);
  });
  useFormReset(anchor, () => setHeld(defaultValue));
  // React keeps a controlled input's `value` attribute in step with what it
  // renders, so the default is written back after every render.
  useFormDefault(anchor, (node: HTMLInputElement) => {
    node.defaultValue = String(defaultValue);
  });

  return useMemo(() => {
    // Snapped against the bounds of this render: constraints changed after
    // mount reach the value with no report.
    const state = core.initialState({ value: held, min, max, step, orientation, disabled, id });
    const api = core.connect({
      state,
      setValue: (next) => {
        if (next === state.value) return;
        setHeld(next);
        onValueChange?.(next);
      },
      normalize: normalizeProps,
    });
    return { ...api, inputProps: inputEvent(api.inputProps) };
  }, [held, min, max, step, orientation, disabled, id, onValueChange]);
}
