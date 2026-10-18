import type { Dir } from "../i18n/locale";
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

/**
 * Thumb start offset as a fraction (0..1) of the track length, from the
 * inline or block start. In right-to-left text `scrollLeft` runs from 0 down to
 * negative values, so its distance from the start is its absolute value.
 */
export function thumbOffsetFraction(metrics: ScrollMetrics): number {
  const maxScroll = metrics.scrollSize - metrics.clientSize;
  if (maxScroll <= 0) return 0;
  const progress = clamp01(Math.abs(metrics.scrollPos) / maxScroll);
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
 * Pass the viewport's `direction` for the horizontal thumb: in right-to-left
 * text the thumb starts at the right and `scrollLeft` is zero or negative.
 */
export function scrollByThumbDrag(
  deltaPx: number,
  metrics: ScrollMetrics,
  direction: Dir = "ltr",
): number {
  const sign = direction === "rtl" ? -1 : 1;
  const { scrollSize, clientSize } = metrics;
  const scrollPos = Math.abs(metrics.scrollPos);
  const maxScroll = Math.max(0, scrollSize - clientSize);
  const next = clientSize <= 0 ? scrollPos : scrollPos + (sign * deltaPx * scrollSize) / clientSize;
  // `+ 0` turns -0 into 0, so a left-to-right result is never negative zero.
  return sign * Math.min(maxScroll, Math.max(0, next)) + 0;
}
