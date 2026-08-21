import type { ToolbarMoveOptions } from "./types";

/**
 * The index focus moves to, or `null` when the key is not one the toolbar
 * handles (so the adapter leaves the event alone). Movement wraps around, and
 * Home and End jump to the ends.
 */
export function nextIndex({
  key,
  index,
  count,
  orientation = "horizontal",
  direction = "ltr",
}: ToolbarMoveOptions): number | null {
  if (count <= 0 || index < 0 || index >= count) return null;

  const wrap = (next: number) => ((next % count) + count) % count;

  if (key === "Home") return 0;
  if (key === "End") return count - 1;

  const horizontal = orientation === "horizontal";
  // In right-to-left text the visual start is on the right, so ArrowRight
  // walks back through the controls and ArrowLeft walks forward.
  const forwardKey = horizontal ? (direction === "rtl" ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
  const backwardKey = horizontal ? (direction === "rtl" ? "ArrowRight" : "ArrowLeft") : "ArrowUp";

  if (key === forwardKey) return wrap(index + 1);
  if (key === backwardKey) return wrap(index - 1);
  return null;
}
