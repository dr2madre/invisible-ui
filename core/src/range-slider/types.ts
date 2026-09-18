export type Orientation = "horizontal" | "vertical";

/** Internal, fully-resolved state of a range slider. */
export interface RangeSliderState {
  /** `[lower, upper]`. `lower` is always `value[0]`, `upper` is always
   * `value[1]`: this is a position, not a "which one is smaller" rule, so
   * identity never swaps even when the two touch. */
  value: readonly [number, number];
  min: number;
  max: number;
  /** Step increment. Defaults to `1`. */
  step: number;
  /** The gap the two thumbs may not close. Always a multiple of `step`
   * (rounded on the way in), so the bound one thumb clamps against is
   * always itself a point on the step grid. Defaults to `0`: the thumbs may
   * touch, never cross. */
  minDistance: number;
  orientation: Orientation;
  disabled: boolean;
  /** Base id (styling/labelling hook). */
  id: string;
}

/** User-provided options when creating a range slider. */
export interface RangeSliderContext {
  /** Initial value. Defaults to `[min, max]`. Normalized against
   * `minDistance` the same way a user's own drag would be: the lower value
   * is taken as given and the upper value is clamped against it, never the
   * other way around, so an invalid default (closer together than
   * `minDistance` allows) still resolves to a legal pair. */
  value?: readonly [number, number];
  min?: number;
  max?: number;
  step?: number;
  minDistance?: number;
  orientation?: Orientation;
  disabled?: boolean;
  id?: string;
  /** Called whenever the value pair changes. Reports the complete pair,
   * once, only when it actually changed (ADR 0011): a press that clamps
   * back to the value it started from is not a change. */
  onValueChange?: (value: readonly [number, number]) => void;
}
