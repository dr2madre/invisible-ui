import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";

export type { Placement };

export interface FloatingOptions {
  /** Preferred placement; flips when there's no room. Default `"bottom-start"`. */
  placement?: Placement;
  /** Gap between anchor and floating element, in px. Default `4`. */
  offset?: number;
  /** Viewport padding kept by flip/shift, in px. Default `8`. */
  padding?: number;
  /** Match the floating element's `min-width` to the anchor's width. */
  sameWidth?: boolean;
  /** Positioning strategy. Default `"fixed"` (escapes overflow/clip). */
  strategy?: "fixed" | "absolute";
}

/**
 * Position `floating` against `anchor` with Floating UI (flip + shift) and keep
 * it positioned until the returned cleanup runs. The shared overlay positioning
 * primitive used by Select, Dropdown Menu, Popover, Tooltip, … so the geometry
 * lives in one place.
 *
 * Sets `left`/`top` (use with `position: fixed`/`absolute` on the element).
 * Falls back to a single positioning pass when `ResizeObserver` is unavailable
 * (e.g. jsdom), so it stays safe under tests/SSR.
 */
export function attachFloating(
  anchor: HTMLElement,
  floating: HTMLElement,
  options: FloatingOptions = {},
): () => void {
  const {
    placement = "bottom-start",
    offset: gap = 4,
    padding = 8,
    sameWidth = false,
    strategy = "fixed",
  } = options;

  if (sameWidth) floating.style.minWidth = `${anchor.offsetWidth}px`;

  const update = () => {
    computePosition(anchor, floating, {
      placement,
      strategy,
      middleware: [offset(gap), flip({ padding }), shift({ padding })],
    }).then(({ x, y }) => {
      floating.style.left = `${x}px`;
      floating.style.top = `${y}px`;
    });
  };

  if (typeof ResizeObserver !== "undefined") {
    return autoUpdate(anchor, floating, update);
  }
  update();
  return () => {};
}
