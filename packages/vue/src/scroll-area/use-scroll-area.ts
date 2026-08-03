import { scrollArea as core } from "@design-system/core";
import { onScopeDispose, ref, watch, type Ref } from "vue";

export type ScrollOrientation = core.ScrollOrientation;
export type ScrollbarGeometry = core.ScrollbarGeometry;

export interface UseScrollArea {
  /** Template ref for the scrollable viewport. */
  viewportRef: Ref<HTMLElement | null>;
  /** Vertical scrollbar geometry (overflow plus thumb size/offset fractions). */
  vertical: Ref<ScrollbarGeometry>;
  /** Horizontal scrollbar geometry. */
  horizontal: Ref<ScrollbarGeometry>;
  /** Start a thumb drag along one axis; bind to the thumb's `pointerdown`. */
  onThumbPointerDown: (axis: "vertical" | "horizontal", event: PointerEvent) => void;
}

const EMPTY: ScrollbarGeometry = { overflow: false, sizeFraction: 1, offsetFraction: 0 };

/**
 * Connect the headless scroll area to Vue. The scrollbar geometry math lives in
 * `@design-system/core`; this composable owns the DOM: it measures the viewport
 * on scroll and resize (`ResizeObserver`) to derive each thumb's size and
 * offset, and maps a thumb drag back onto the viewport's native scroll. Native
 * scrollbars are hidden by the styled layer; keyboard scrolling stays native.
 */
export function useScrollArea(): UseScrollArea {
  const viewportRef = ref<HTMLElement | null>(null);
  const vertical = ref<ScrollbarGeometry>(EMPTY);
  const horizontal = ref<ScrollbarGeometry>(EMPTY);

  const measure = () => {
    const node = viewportRef.value;
    if (!node) return;
    vertical.value = core.scrollbar({
      scrollPos: node.scrollTop,
      scrollSize: node.scrollHeight,
      clientSize: node.clientHeight,
    });
    horizontal.value = core.scrollbar({
      scrollPos: node.scrollLeft,
      scrollSize: node.scrollWidth,
      clientSize: node.clientWidth,
    });
  };

  // The viewport element carries the listeners, so the effect keys on it and
  // its cleanup runs whenever it is replaced or unmounted.
  watch(
    viewportRef,
    (node, _previous, onCleanup) => {
      if (!node) return;
      const onScroll = () => measure();
      node.addEventListener("scroll", onScroll, { passive: true });

      let observer: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => measure());
        observer.observe(node);
        if (node.firstElementChild) observer.observe(node.firstElementChild);
      }
      measure();

      onCleanup(() => {
        node.removeEventListener("scroll", onScroll);
        observer?.disconnect();
      });
    },
    { flush: "post" },
  );

  // --- Thumb dragging. The pointer is captured on the thumb, so the moves keep
  // arriving even when the cursor leaves it.
  let dragAxis: "vertical" | "horizontal" | null = null;
  let dragNode: HTMLElement | null = null;
  let last = 0;

  const onPointerMove = (event: PointerEvent) => {
    const node = viewportRef.value;
    if (!dragAxis || !node) return;
    const current = dragAxis === "vertical" ? event.clientY : event.clientX;
    const delta = current - last;
    last = current;
    if (dragAxis === "vertical") {
      node.scrollTop = core.scrollByThumbDrag(delta, {
        scrollPos: node.scrollTop,
        scrollSize: node.scrollHeight,
        clientSize: node.clientHeight,
      });
    } else {
      node.scrollLeft = core.scrollByThumbDrag(delta, {
        scrollPos: node.scrollLeft,
        scrollSize: node.scrollWidth,
        clientSize: node.clientWidth,
      });
    }
  };

  const endDrag = (event: PointerEvent) => {
    dragAxis = null;
    if (dragNode?.hasPointerCapture?.(event.pointerId)) {
      dragNode.releasePointerCapture(event.pointerId);
    }
    dragNode = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  };

  const onThumbPointerDown = (axis: "vertical" | "horizontal", event: PointerEvent) => {
    if (!viewportRef.value) return;
    dragAxis = axis;
    dragNode = event.currentTarget as HTMLElement;
    last = axis === "vertical" ? event.clientY : event.clientX;
    dragNode.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  onScopeDispose(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  });

  return { viewportRef, vertical, horizontal, onThumbPointerDown };
}
