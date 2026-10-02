// One line: scripts/check-elements-dist.mjs reads the dist's imports line by line.
import { autoUpdate, computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";
import type { VirtualElement } from "@floating-ui/dom";

export type { Placement };

export interface FloatingOptions {
  /** Preferred placement; flips when there's no room. Default `"bottom-start"`. */
  placement?: Placement;
  /** Gap between anchor and floating element, in px. Default `4`. */
  offset?: number;
  /** Viewport padding kept by flip/shift, in px. Default `8`. */
  padding?: number;
  /**
   * Match the floating element's `min-width` to the anchor's width, read once
   * at attach time. Given an element instead, match that element's width,
   * read again on every update: reconnecting can land in a subtree that is
   * not laid out yet, where the width reads as zero.
   */
  sameWidth?: boolean | HTMLElement;
  /** Positioning strategy. Default `"fixed"` (escapes overflow/clip). */
  strategy?: "fixed" | "absolute";
}

/**
 * Position `floating` against `anchor` once, with Floating UI (flip + shift).
 * The anchor can be a virtual element, such as the point a context menu
 * opens at. Sets `left`/`top`.
 */
export function positionFloating(
  anchor: HTMLElement | VirtualElement,
  floating: HTMLElement,
  options: FloatingOptions = {},
): void {
  const { placement = "bottom-start", offset: gap = 4, padding = 8, strategy = "fixed" } = options;
  void computePosition(anchor, floating, {
    placement,
    strategy,
    middleware: [offset(gap), flip({ padding }), shift({ padding })],
  }).then(({ x, y }) => {
    floating.style.left = `${x}px`;
    floating.style.top = `${y}px`;
  });
}

/**
 * Position `floating` against `anchor` with Floating UI (flip + shift) and keep
 * it positioned until the returned cleanup runs. The overlay positioning helper
 * of this adapter, ported from the Vue one so the geometry lives in one place.
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
  const { sameWidth = false } = options;

  if (sameWidth === true) floating.style.minWidth = `${anchor.offsetWidth}px`;

  const update = () => {
    if (typeof sameWidth === "object") {
      floating.style.minWidth = `${sameWidth.offsetWidth}px`;
    }
    positionFloating(anchor, floating, options);
  };

  if (typeof ResizeObserver !== "undefined") {
    return autoUpdate(anchor, floating, update);
  }
  update();
  return () => {};
}
