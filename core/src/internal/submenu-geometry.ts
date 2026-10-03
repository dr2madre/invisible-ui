/**
 * Pure geometry for submenus: the grace area that keeps a submenu open while
 * the pointer travels to it, and the side a submenu opens on. Coordinates are
 * viewport pixels, `x` to the right and `y` down. Timing and measuring stay in
 * the adapters; these functions take numbers and return numbers, so every
 * platform answers the same shared test vectors.
 */

/** A physical side of a rectangle. */
export type Side = "left" | "right";

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Whether `point` lies inside `polygon` (even-odd rule, ray casting). A point
 * exactly on an edge may fall either way; the grace area does not depend on it.
 */
export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    const crosses =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** How far behind the exit point the grace area starts, so it is a little wider than the trigger. */
export const GRACE_BLEED = 5;

/**
 * The grace area: a triangle from the point where the pointer left the
 * trigger to the two near corners of the open submenu. The exit point moves
 * {@link GRACE_BLEED} pixels away from the submenu, so a pointer that starts
 * moving at once is still inside. `side` is the physical side of the trigger
 * the submenu sits on.
 */
export function graceArea(exit: Point, submenu: Rect, side: Side): Point[] {
  const nearX = side === "right" ? submenu.x : submenu.x + submenu.width;
  const bleed = side === "right" ? -GRACE_BLEED : GRACE_BLEED;
  return [
    { x: exit.x + bleed, y: exit.y },
    { x: nearX, y: submenu.y },
    { x: nearX, y: submenu.y + submenu.height },
  ];
}

/** Whether the pointer is inside the grace area of a submenu. */
export const isInGraceArea = (pointer: Point, exit: Point, submenu: Rect, side: Side): boolean =>
  pointInPolygon(pointer, graceArea(exit, submenu, side));

export interface SubmenuPlacementInput {
  /** The submenu trigger's rectangle. */
  anchor: Rect;
  /** The submenu's natural size. */
  menu: Size;
  /** The viewport size. */
  viewport: Size;
  /** Reading direction; inline-end is the right side in `"ltr"`. */
  direction?: "ltr" | "rtl";
  /** Space kept free at the viewport edges. Defaults to 8. */
  padding?: number;
}

export interface SubmenuPlacement {
  /** Where the submenu went: beside the trigger at either side, or over its parent. */
  side: "inline-end" | "inline-start" | "overlap";
  /** Physical side, for the grace area; `null` when the submenu overlaps its parent. */
  physicalSide: Side | null;
  x: number;
  y: number;
  /** Tallest the submenu may be; it scrolls inside beyond this. */
  maxHeight: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

/**
 * Choose where a submenu opens: at the inline-end of its trigger, top
 * aligned; at the inline-start when the inline-end has no room; over its
 * parent menu, shifted inside the viewport, when neither side has room. It
 * shifts up to stay in the viewport, and its maximum height is the viewport
 * height minus the padding at both edges.
 */
export function placeSubmenu({
  anchor,
  menu,
  viewport,
  direction = "ltr",
  padding = 8,
}: SubmenuPlacementInput): SubmenuPlacement {
  const at: Record<Side, number> = { right: anchor.x + anchor.width, left: anchor.x - menu.width };
  const room: Record<Side, boolean> = {
    right: at.right + menu.width <= viewport.width - padding,
    left: at.left >= padding,
  };
  const [end, start]: [Side, Side] = direction === "rtl" ? ["left", "right"] : ["right", "left"];

  const maxHeight = Math.max(0, viewport.height - padding * 2);
  const y = clamp(anchor.y, padding, viewport.height - padding - Math.min(menu.height, maxHeight));

  if (room[end]) return { side: "inline-end", physicalSide: end, x: at[end], y, maxHeight };
  if (room[start]) return { side: "inline-start", physicalSide: start, x: at[start], y, maxHeight };
  const x = clamp(at[end], padding, viewport.width - padding - menu.width);
  return { side: "overlap", physicalSide: null, x, y, maxHeight };
}
