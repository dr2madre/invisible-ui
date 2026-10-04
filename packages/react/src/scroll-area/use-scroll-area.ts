import { scrollArea as core } from "@design-system/core";
import { useEffect, useRef, useState, type PointerEvent } from "react";

export type ScrollOrientation = core.ScrollOrientation;
export type ScrollbarGeometry = core.ScrollbarGeometry;
export type ScrollAxis = "vertical" | "horizontal";

export interface UseScrollArea {
  /** Callback ref for the scrollable viewport. */
  viewportRef: (node: HTMLElement | null) => void;
  /** Vertical scrollbar geometry: overflow, and the thumb's size and offset fractions. */
  vertical: ScrollbarGeometry;
  /** Horizontal scrollbar geometry. */
  horizontal: ScrollbarGeometry;
  /** Pointer handlers that let a thumb be dragged along its axis. */
  getThumbProps: (axis: ScrollAxis) => {
    onPointerDown: (event: PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  };
}

const EMPTY: ScrollbarGeometry = { overflow: false, sizeFraction: 1, offsetFraction: 0 };

const metrics = (node: HTMLElement, axis: ScrollAxis): core.ScrollMetrics =>
  axis === "vertical"
    ? { scrollPos: node.scrollTop, scrollSize: node.scrollHeight, clientSize: node.clientHeight }
    : { scrollPos: node.scrollLeft, scrollSize: node.scrollWidth, clientSize: node.clientWidth };

// Keeps the previous geometry when nothing moved, so a scroll that does not
// change a thumb renders nothing.
const measured =
  (node: HTMLElement, axis: ScrollAxis) =>
  (previous: ScrollbarGeometry): ScrollbarGeometry => {
    const next = core.scrollbar(metrics(node, axis));
    return next.overflow === previous.overflow &&
      next.sizeFraction === previous.sizeFraction &&
      next.offsetFraction === previous.offsetFraction
      ? previous
      : next;
  };

/**
 * Connect the headless scroll area to React. The geometry math lives in
 * `@design-system/core`; the hook owns the DOM: it measures the viewport on
 * scroll and on resize (`ResizeObserver`) to size and place each thumb, and
 * maps a thumb drag back onto the viewport's native scroll. Hide the native
 * scrollbars in your styles; keyboard and wheel scrolling stay native.
 */
export function useScrollArea(): UseScrollArea {
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const [vertical, setVertical] = useState(EMPTY);
  const [horizontal, setHorizontal] = useState(EMPTY);
  // The axis being dragged and the last pointer position along it.
  const drag = useRef<{ axis: ScrollAxis; last: number } | null>(null);

  useEffect(() => {
    if (!viewport) return;
    const measure = () => {
      setVertical(measured(viewport, "vertical"));
      setHorizontal(measured(viewport, "horizontal"));
    };
    viewport.addEventListener("scroll", measure, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(viewport);
    if (viewport.firstElementChild) observer?.observe(viewport.firstElementChild);
    measure();
    return () => {
      viewport.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, [viewport]);

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const getThumbProps: UseScrollArea["getThumbProps"] = (axis) => ({
    onPointerDown: (event) => {
      if (!viewport) return;
      drag.current = { axis, last: axis === "vertical" ? event.clientY : event.clientX };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    },
    onPointerMove: (event) => {
      const active = drag.current;
      if (!active || !viewport) return;
      const current = active.axis === "vertical" ? event.clientY : event.clientX;
      const next = core.scrollByThumbDrag(current - active.last, metrics(viewport, active.axis));
      active.last = current;
      if (active.axis === "vertical") viewport.scrollTop = next;
      else viewport.scrollLeft = next;
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  });

  return { viewportRef: setViewport, vertical, horizontal, getThumbProps };
}
