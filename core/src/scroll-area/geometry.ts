import type { ScrollMetrics, ScrollbarGeometry } from "./types";

/** Sub-pixel tolerance so rounding never reports a phantom 1px overflow. */
const EPSILON = 1;

/** Whether the content overflows the viewport along this axis. */
export function hasOverflow({ scrollSize, clientSize }: ScrollMetrics): boolean {
  return scrollSize - clientSize > EPSILON;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Thumb length as a fraction (0..1] of the track (= viewport) length. */
export function thumbSizeFraction({ scrollSize, clientSize }: ScrollMetrics): number {
  if (scrollSize <= 0) return 1;
  return clamp01(clientSize / scrollSize);
}

/** Thumb start offset as a fraction (0..1) of the track length. */
export function thumbOffsetFraction(metrics: ScrollMetrics): number {
  const maxScroll = metrics.scrollSize - metrics.clientSize;
  if (maxScroll <= 0) return 0;
  const progress = clamp01(metrics.scrollPos / maxScroll);
  return progress * (1 - thumbSizeFraction(metrics));
}

/** Combined geometry for one scrollbar. */
export function scrollbar(metrics: ScrollMetrics): ScrollbarGeometry {
  return {
    overflow: hasOverflow(metrics),
    sizeFraction: thumbSizeFraction(metrics),
    offsetFraction: thumbOffsetFraction(metrics),
  };
}

/**
 * New scroll position after dragging the thumb by `deltaPx` along the track.
 * The viewport scrolls proportionally faster than the thumb (by
 * `scrollSize / clientSize`), and the result is clamped to the scrollable range.
 */
export function scrollByThumbDrag(deltaPx: number, metrics: ScrollMetrics): number {
  const { scrollPos, scrollSize, clientSize } = metrics;
  if (clientSize <= 0) return scrollPos;
  const next = scrollPos + (deltaPx * scrollSize) / clientSize;
  return Math.min(scrollSize - clientSize, Math.max(0, next));
}
