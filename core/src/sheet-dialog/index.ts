/**
 * The edge a sheet dialog is anchored to. `start` and `end` follow the
 * reading direction (inline-start and inline-end); `top` and `bottom` never
 * move.
 */
export type SheetSide = "top" | "bottom" | "start" | "end";

/** Fraction of the panel extent past which releasing a drag dismisses the panel. */
export const DISMISS_DISTANCE_RATIO = 0.25;

/** Outward velocity (px/ms) past which releasing a drag dismisses regardless of distance. */
export const DISMISS_VELOCITY = 0.5;

/** The edge a sheet is anchored to; no side is `end`. */
export function edge(side: SheetSide | undefined): SheetSide {
  return side ?? "end";
}

/**
 * How far a pointer has moved toward the anchored edge since the drag began,
 * positive while dismissing. `dx` and `dy` are the pointer's movement in
 * screen coordinates. The inline edges are measured along the reading
 * direction: `end` is the right edge in left-to-right text and the left edge
 * in right-to-left text.
 */
export function outward(edge: SheetSide, direction: "ltr" | "rtl", dx: number, dy: number): number {
  switch (edge) {
    case "bottom":
      return dy;
    case "top":
      return -dy;
    case "end":
      return direction === "rtl" ? -dx : dx;
    case "start":
      return direction === "rtl" ? dx : -dx;
  }
}

/** Whether releasing a drag dismisses the panel. */
export function shouldDismiss(offset: number, extent: number, velocity: number): boolean {
  return (extent > 0 && offset > extent * DISMISS_DISTANCE_RATIO) || velocity > DISMISS_VELOCITY;
}
