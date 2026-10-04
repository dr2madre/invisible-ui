import { useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "../internal/cx";
import { SliderField } from "./SliderField";
import { useSlider, type SliderOrientation } from "./use-slider";

export interface SliderProps {
  /** Initial (uncontrolled) or current (controlled) value. */
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  orientation?: SliderOrientation;
  disabled?: boolean;
  /** Accessible name for the slider (required). */
  label: string;
  /** Form field name; the value is submitted under it. */
  name?: string;
  /** Show the current value to the side of the track. */
  showValue?: boolean;
  /** Show the min and max reference values under the ends of the track. */
  showRange?: boolean;
  /** Show tick marks at each step (drawn only when the count stays readable). */
  ticks?: boolean;
  /** Format the displayed value/range (e.g. add a unit). */
  format?: (value: number) => string;
  /** Called whenever the value changes. */
  onValueChange?: (value: number) => void;
  /** A decorative icon before the track. */
  icon?: ReactNode;
}

// Above this many steps the ticks would crowd into a solid line, so they are
// dropped instead.
const MAX_TICKS = 20;

/** Tick positions as percentages, one per step, spread over the whole track. */
const tickPositions = (ticks: boolean, min: number, max: number, step: number) => {
  const count = step > 0 ? Math.round((max - min) / step) : 0;
  return ticks && count > 0 && count <= MAX_TICKS
    ? Array.from({ length: count + 1 }, (_, i) => (i / count) * 100)
    : [];
};

/**
 * Slider — a styled single-thumb slider built on a native
 * `<input type="range">`. The browser provides the slider role, ARIA value,
 * keyboard control (arrows / Page / Home / End), pointer dragging, focus and
 * form participation; this layer styles the track, the filled portion and the
 * thumb.
 *
 * Provide a `label` for the accessible name. Colors, sizing and the thumb are
 * themeable via `--ds-slider-*`.
 */
export function Slider({
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  orientation = "horizontal",
  disabled = false,
  label,
  name,
  showValue = false,
  showRange = false,
  ticks = false,
  format = String,
  onValueChange,
  icon,
}: SliderProps) {
  const ref = useRef<HTMLInputElement>(null);
  const api = useSlider({
    value,
    min,
    max,
    step,
    orientation,
    disabled,
    onValueChange,
    controlRef: ref,
  });
  const positions = tickPositions(ticks, api.min, api.max, api.step);

  return (
    <SliderField
      block="slider"
      disabled={disabled}
      icon={icon}
      valueText={showValue ? format(api.value) : undefined}
      range={showRange ? [format(api.min), format(api.max)] : undefined}
    >
      <span
        className={cx("slider", disabled && "slider--disabled")}
        data-orientation={orientation}
        style={{ "--_slider-pct": `${api.percentage}%` } as CSSProperties}
      >
        <input
          {...api.inputProps}
          ref={ref}
          className="slider__input"
          name={name}
          aria-label={label}
          value={api.value}
        />
        {positions.length > 0 ? (
          <span className="slider__ticks" aria-hidden="true">
            {positions.map((position) => (
              <span
                key={position}
                className="slider__tick"
                style={{ insetInlineStart: `${position}%` }}
              />
            ))}
          </span>
        ) : null}
      </span>
    </SliderField>
  );
}
