import type { CSSProperties, ReactNode } from "react";
import { useScrollArea, type ScrollOrientation } from "./use-scroll-area";

export interface ScrollAreaProps {
  /** Which axes scroll. Defaults to `vertical`. */
  orientation?: ScrollOrientation;
  /** Largest block size of the viewport, the scroll constraint, such as `"12rem"`. */
  maxHeight?: string;
  /**
   * Optional accessible name; makes the viewport a labelled region. Two
   * scroll areas on a page should not share one: the landmark list would show
   * the same entry twice.
   */
  label?: string;
  /** The scrolling content. */
  children?: ReactNode;
}

const OVERFLOW: Record<ScrollOrientation, CSSProperties> = {
  vertical: { overflowY: "auto", overflowX: "hidden" },
  horizontal: { overflowX: "auto", overflowY: "hidden" },
  both: { overflow: "auto" },
};

/**
 * ScrollArea: a scrollable viewport with overlay scrollbars. The scrollbar
 * geometry comes from the headless scroll area (`@design-system/core`);
 * `useScrollArea` measures the viewport and lets a thumb be dragged. Native
 * scrollbars are hidden, while keyboard and wheel scrolling stay native: the
 * viewport takes focus and scrolls with the arrow keys.
 *
 * Themeable via `--ds-scroll-area-*`.
 */
export function ScrollArea({
  orientation = "vertical",
  maxHeight = "12rem",
  label,
  children,
}: ScrollAreaProps) {
  const { viewportRef, vertical, horizontal, getThumbProps } = useScrollArea();
  const showVertical = orientation !== "horizontal" && vertical.overflow;
  const showHorizontal = orientation !== "vertical" && horizontal.overflow;
  // The shared sheet leaves the scroll constraint, the overflow axes and the
  // thumb geometry to the adapter, so they go inline as in the other adapters.
  return (
    <div className="scroll-area" data-orientation={orientation}>
      <div
        ref={viewportRef}
        className="scroll-area__viewport"
        // A scrollable region has to be reachable by keyboard.
        tabIndex={0}
        role={label ? "region" : undefined}
        aria-label={label}
        style={{ maxBlockSize: maxHeight, ...OVERFLOW[orientation] }}
      >
        {children}
      </div>
      {showVertical ? (
        <div className="scroll-area__bar scroll-area__bar--v" aria-hidden="true">
          <div
            {...getThumbProps("vertical")}
            className="scroll-area__thumb"
            style={{
              blockSize: `${vertical.sizeFraction * 100}%`,
              insetBlockStart: `${vertical.offsetFraction * 100}%`,
            }}
          />
        </div>
      ) : null}
      {showHorizontal ? (
        <div className="scroll-area__bar scroll-area__bar--h" aria-hidden="true">
          <div
            {...getThumbProps("horizontal")}
            className="scroll-area__thumb"
            style={{
              inlineSize: `${horizontal.sizeFraction * 100}%`,
              insetInlineStart: `${horizontal.offsetFraction * 100}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
