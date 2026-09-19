/**
 * Where a pointer is along the track, and which thumb a press there should
 * reach. Pure arithmetic over a box and a point: the adapter reads the box
 * and the writing direction from the DOM and passes them in, so every mode
 * (horizontal LTR and RTL, vertical) is one rule here rather than one
 * calculation per adapter.
 */

export interface PointerAxis {
  orientation: "horizontal" | "vertical";
  /** The input's computed `direction`. Under `rtl` a native range paints
   * `min` on the right; under the vertical writing this library uses
   * (`vertical-lr` with `direction: rtl`) it paints `min` at the bottom.
   * Measured identical in Chromium, Firefox and WebKit. */
  rtl: boolean;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The pointer's position along the logical axis, 0 at the `min` end and 1
 * at the `max` end, whatever the physical direction. Clamped, so a pointer
 * past either end reads as that end.
 */
export function pointerFraction(axis: PointerAxis, box: Box, x: number, y: number): number {
  let fraction: number;
  if (axis.orientation === "vertical") {
    if (box.height <= 0) return 0;
    fraction = axis.rtl ? (box.top + box.height - y) / box.height : (y - box.top) / box.height;
  } else {
    if (box.width <= 0) return 0;
    fraction = axis.rtl ? (box.left + box.width - x) / box.width : (x - box.left) / box.width;
  }
  return Math.min(1, Math.max(0, fraction));
}

/** A value's position along the track, 0 at `min` and 1 at `max`. */
export function valueFraction(value: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (value - min) / span));
}

/**
 * The thumb a press at `pointer` should reach, as an index into the pair.
 * Two thumbs apart: the nearer one, the lower one when the pointer sits
 * exactly midway. Two thumbs stacked: the side of the stack the pointer is
 * on decides, since that is the direction the user is about to drag in; a
 * pointer dead on the stack reaches the thumb that can still move, which at
 * the top of the track is the lower one and everywhere else the upper one.
 */
export function nearerThumb(pointer: number, lower: number, upper: number): 0 | 1 {
  if (lower === upper) {
    if (pointer > lower) return 1;
    if (pointer < lower) return 0;
    return lower >= 1 ? 0 : 1;
  }
  return Math.abs(pointer - lower) <= Math.abs(pointer - upper) ? 0 : 1;
}

/**
 * The thumb that should sit on top when no pointer has said otherwise: a
 * touch, or a press with no hover before it, lands on whichever is on top.
 * Apart, the order does not matter for reach and DOM order stands (the upper
 * thumb on top). Stacked at the top of the track only the lower thumb can
 * move, so it is raised; stacked anywhere else the upper thumb is, and the
 * lower one is reached by moving the upper one off it first.
 */
export function restingThumb(lower: number, upper: number): 0 | 1 {
  return lower === upper && lower >= 1 ? 0 : 1;
}
