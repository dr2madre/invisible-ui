import { scrollArea as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { writable, type Readable } from "svelte/store";

export type ScrollOrientation = core.ScrollOrientation;
export type ScrollbarGeometry = core.ScrollbarGeometry;

export interface CreateScrollArea {
  /** Vertical scrollbar geometry (overflow + thumb size/offset fractions). */
  vertical: Readable<ScrollbarGeometry>;
  /** Horizontal scrollbar geometry. */
  horizontal: Readable<ScrollbarGeometry>;
  /** Action for the scrollable viewport: `<div use:viewportAction>`. */
  viewportAction: Action<HTMLElement>;
  /** Action for a scrollbar thumb: `<div use:thumbAction={"vertical"}>`. */
  thumbAction: Action<HTMLElement, "vertical" | "horizontal">;
}

const EMPTY: ScrollbarGeometry = { overflow: false, sizeFraction: 1, offsetFraction: 0 };

/**
 * Create a headless scroll area. The scrollbar geometry math lives in
 * `@design-system/core`; this adapter owns the DOM: it measures the viewport on
 * scroll and resize (`ResizeObserver`) to derive each thumb's size/offset, and
 * maps a thumb drag back onto the viewport's native scroll. Native scrollbars
 * are hidden by the styled layer; keyboard scrolling stays native.
 */
export function createScrollArea(): CreateScrollArea {
  const vertical = writable<ScrollbarGeometry>(EMPTY);
  const horizontal = writable<ScrollbarGeometry>(EMPTY);
  let viewportEl: HTMLElement | null = null;

  const measure = () => {
    if (!viewportEl) return;
    vertical.set(
      core.scrollbar({
        scrollPos: viewportEl.scrollTop,
        scrollSize: viewportEl.scrollHeight,
        clientSize: viewportEl.clientHeight,
      }),
    );
    horizontal.set(
      core.scrollbar({
        scrollPos: viewportEl.scrollLeft,
        scrollSize: viewportEl.scrollWidth,
        clientSize: viewportEl.clientWidth,
      }),
    );
  };

  const viewportAction: Action<HTMLElement> = (node) => {
    viewportEl = node;
    const onScroll = () => measure();
    node.addEventListener("scroll", onScroll, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => measure());
      observer.observe(node);
      if (node.firstElementChild) observer.observe(node.firstElementChild);
    }
    measure();

    return {
      destroy() {
        node.removeEventListener("scroll", onScroll);
        observer?.disconnect();
        if (viewportEl === node) viewportEl = null;
      },
    };
  };

  const thumbAction: Action<HTMLElement, "vertical" | "horizontal"> = (node, axis) => {
    let dragging = false;
    let last = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (!viewportEl) return;
      dragging = true;
      last = axis === "vertical" ? event.clientY : event.clientX;
      node.setPointerCapture(event.pointerId);
      event.preventDefault();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || !viewportEl) return;
      const current = axis === "vertical" ? event.clientY : event.clientX;
      const delta = current - last;
      last = current;
      if (axis === "vertical") {
        viewportEl.scrollTop = core.scrollByThumbDrag(delta, {
          scrollPos: viewportEl.scrollTop,
          scrollSize: viewportEl.scrollHeight,
          clientSize: viewportEl.clientHeight,
        });
      } else {
        viewportEl.scrollLeft = core.scrollByThumbDrag(delta, {
          scrollPos: viewportEl.scrollLeft,
          scrollSize: viewportEl.scrollWidth,
          clientSize: viewportEl.clientWidth,
        });
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (node.hasPointerCapture?.(event.pointerId)) node.releasePointerCapture(event.pointerId);
    };

    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", onPointerUp);

    return {
      destroy() {
        node.removeEventListener("pointerdown", onPointerDown);
        node.removeEventListener("pointermove", onPointerMove);
        node.removeEventListener("pointerup", onPointerUp);
      },
    };
  };

  return { vertical, horizontal, viewportAction, thumbAction };
}
