export type Orientation = "horizontal" | "vertical";

/** Internal, fully-resolved state of a slider. */
export interface SliderState {
  /** Current value (already clamped and snapped to the step). */
  value: number;
  min: number;
  max: number;
  /** Step increment. Defaults to `1`. */
  step: number;
  orientation: Orientation;
  disabled: boolean;
  /** Base id (styling/labelling hook). */
  id: string;
}

/** User-provided options when creating a slider. */
export interface SliderContext {
  /** Initial value. Defaults to `min`. */
  value?: number;
  /** Minimum value. Defaults to `0`. */
  min?: number;
  /** Maximum value. Defaults to `100`. */
  max?: number;
  /** Step increment. Defaults to `1`. */
  step?: number;
  /** Orientation. Defaults to `horizontal`. */
  orientation?: Orientation;
  /** Whether the slider is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Base id. Auto-generated when omitted. */
  id?: string;
  /** Called whenever the value changes. */
  onValueChange?: (value: number) => void;
}
