/**
 * A scroll area — a scrollable viewport with custom (overlay) scrollbars. The
 * "headless" part is pure geometry: given a viewport's scroll metrics it derives
 * the scrollbar thumb size and offset, and maps a thumb drag back to a scroll
 * position. The native scroll, measurement (ResizeObserver / scroll events) and
 * drag wiring are DOM concerns owned by the adapter.
 */

export type ScrollOrientation = "vertical" | "horizontal" | "both";

/** A viewport's scroll metrics along one axis (in px). */
export interface ScrollMetrics {
  /** `scrollTop` or `scrollLeft`. */
  scrollPos: number;
  /** `scrollHeight` or `scrollWidth`. */
  scrollSize: number;
  /** `clientHeight` or `clientWidth` (the visible track length). */
  clientSize: number;
}

/** Derived geometry for one scrollbar. Fractions are of the track length. */
export interface ScrollbarGeometry {
  /** Whether the content overflows along this axis. */
  overflow: boolean;
  /** Thumb length as a fraction (0..1] of the track. */
  sizeFraction: number;
  /** Thumb start offset as a fraction (0..1) of the track. */
  offsetFraction: number;
}
