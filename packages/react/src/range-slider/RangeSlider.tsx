import { rangeSlider as core } from "@design-system/core";
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { useI18n } from "../i18n/i18n";
import { cx } from "../internal/cx";
import { SliderField } from "../slider/SliderField";
import { useRangeSlider, type RangeSliderOrientation, type RangeValue } from "./use-range-slider";

export interface RangeSliderProps {
  /** Initial (uncontrolled) or current (controlled) value. */
  value?: RangeValue;
  min?: number;
  max?: number;
  step?: number;
  /** The gap the two thumbs may not close. They may touch; they never cross. */
  minDistance?: number;
  orientation?: RangeSliderOrientation;
  disabled?: boolean;
  /** Accessible name for the group (required). */
  label: string;
  /** Accessible name for each thumb: `[lowerLabel, upperLabel]`. */
  thumbLabels: readonly [string, string];
  /**
   * Form field name. Both thumbs submit under it, in order:
   * `FormData.getAll(name)` reads `[String(lower), String(upper)]`.
   */
  name?: string;
  /** Show the current values to the side of the track. */
  showValue?: boolean;
  /** Show the min and max reference values under the ends of the track. */
  showRange?: boolean;
  /** Show tick marks at each step (only when the count is reasonable). */
  ticks?: boolean;
  /** Format a displayed value (e.g. add a unit). */
  format?: (value: number) => string;
  /** Called with the complete pair whenever it changes. */
  onValueChange?: (value: RangeValue) => void;
  /** A decorative icon before the track. */
  icon?: ReactNode;
}

const MAX_TICKS = 20;

type Thumb = RefObject<HTMLInputElement | null>;

const raise = (lower: HTMLInputElement, upper: HTMLInputElement, index: 0 | 1) => {
  lower.style.zIndex = index === 0 ? "2" : "1";
  upper.style.zIndex = index === 1 ? "2" : "1";
};

/** Where each thumb sits along the track, as a 0 to 1 fraction. */
const fractions = (lower: HTMLInputElement, upper: HTMLInputElement): [number, number] => {
  const min = Number(lower.min);
  const max = Number(lower.max);
  return [
    core.valueFraction(Number(lower.value), min, max),
    core.valueFraction(Number(upper.value), min, max),
  ];
};

const rest = (lower: HTMLInputElement, upper: HTMLInputElement) =>
  raise(lower, upper, core.restingThumb(...fractions(lower, upper)));

/**
 * Two overlapping native range inputs hit-test by z-order, not by distance to
 * the pointer, so whichever thumb the next press should reach is raised before
 * the press lands. The rule lives in the core (`nearerThumb`, `restingThumb`);
 * this feeds it what only the DOM knows: the track's box and the input's
 * computed writing direction. A pointer over the track picks the nearer thumb,
 * never during a drag; with no pointer over it the resting rule applies, so a
 * touch, which has no hover before it, still lands on a thumb that can move.
 */
function useNearestThumb(track: RefObject<HTMLDivElement | null>, lower: Thumb, upper: Thumb) {
  const hovering = useRef(false);

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const onMove = (event: PointerEvent) => {
      const lo = lower.current;
      const hi = upper.current;
      if (event.buttons !== 0 || !lo || !hi) return;
      const styles = getComputedStyle(lo);
      const axis: core.PointerAxis = {
        orientation: styles.writingMode.startsWith("vertical") ? "vertical" : "horizontal",
        rtl: styles.direction === "rtl",
      };
      const pointer = core.pointerFraction(
        axis,
        node.getBoundingClientRect(),
        event.clientX,
        event.clientY,
      );
      raise(lo, hi, core.nearerThumb(pointer, ...fractions(lo, hi)));
    };
    const onEnter = () => {
      hovering.current = true;
    };
    const onLeave = () => {
      hovering.current = false;
      if (lower.current && upper.current) rest(lower.current, upper.current);
    };
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [track, lower, upper]);

  // After every render: a value or an axis that moved may change which thumb
  // rests on top.
  useEffect(() => {
    if (!hovering.current && lower.current && upper.current) rest(lower.current, upper.current);
  });
}

/**
 * RangeSlider — a styled two-thumb slider built on two native
 * `<input type="range">` elements sharing one track. The browser provides each
 * thumb's slider role, ARIA value, keyboard control (arrows / Page / Home /
 * End), pointer dragging, focus and form participation; this layer styles the
 * track, the fill between the thumbs and the two thumbs, and keeps them from
 * crossing.
 *
 * Provide `label` for the group's accessible name and `thumbLabels` for each
 * thumb's own name. Colors, sizing and the thumbs are themeable via
 * `--ds-range-slider-*`.
 */
export function RangeSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  minDistance = 0,
  orientation = "horizontal",
  disabled = false,
  label,
  thumbLabels,
  name,
  showValue = false,
  showRange = false,
  ticks = false,
  format = String,
  onValueChange,
  icon,
}: RangeSliderProps) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const lower = useRef<HTMLInputElement>(null);
  const upper = useRef<HTMLInputElement>(null);
  const api = useRangeSlider({
    value,
    min,
    max,
    step,
    minDistance,
    orientation,
    disabled,
    onValueChange,
    thumbRefs: [lower, upper],
  });
  useNearestThumb(track, lower, upper);

  // One tick per grid point the arrows can reach, spaced by the step: a max
  // the grid does not reach has no tick.
  const span = api.max - api.min;
  const tickCount = api.step > 0 ? Math.floor(span / api.step) : 0;
  const tickPositions =
    ticks && tickCount > 0 && tickCount <= MAX_TICKS
      ? Array.from({ length: tickCount + 1 }, (_, i) => ((i * api.step) / span) * 100)
      : [];

  const thumb = (index: 0 | 1) => {
    const props = api.getThumbProps(index);
    return (
      <input
        {...props}
        ref={index === 0 ? lower : upper}
        className="range-slider__input"
        name={name}
        aria-label={thumbLabels[index]}
        aria-valuetext={t(index === 0 ? "rangeSlider.lowerText" : "rangeSlider.upperText", {
          value: format(api.value[index]),
          bound: format(Number(props[index === 0 ? "aria-valuemax" : "aria-valuemin"])),
        })}
        value={api.value[index]}
        onChange={(event) => api.setValue(index, Number(event.currentTarget.value))}
      />
    );
  };

  return (
    <SliderField
      block="range-slider"
      disabled={disabled}
      orientation={orientation}
      icon={icon}
      valueText={showValue ? `${format(api.value[0])} – ${format(api.value[1])}` : undefined}
      range={showRange ? [format(api.min), format(api.max)] : undefined}
    >
      <div
        className={cx("range-slider", disabled && "range-slider--disabled")}
        aria-label={label}
        role="group"
        style={
          {
            "--_range-lower-pct": `${api.percentages[0]}%`,
            "--_range-upper-pct": `${api.percentages[1]}%`,
          } as CSSProperties
        }
        {...api.rootProps}
      >
        <div ref={track} className="range-slider__track">
          <span className="range-slider__range" {...api.rangeProps} />
          {tickPositions.length > 0 ? (
            <span className="range-slider__ticks" aria-hidden="true">
              {tickPositions.map((position) => (
                <span
                  key={position}
                  className="range-slider__tick"
                  style={{ "--_tick-pct": `${position}%` } as CSSProperties}
                />
              ))}
            </span>
          ) : null}
          {thumb(0)}
          {thumb(1)}
        </div>
      </div>
    </SliderField>
  );
}
