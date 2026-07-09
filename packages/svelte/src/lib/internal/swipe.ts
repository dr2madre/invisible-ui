import type { Action } from "svelte/action";

export interface SwipeDismissOptions {
  /** Called once the element has been swiped away. */
  onDismiss?: () => void;
  /** Horizontal distance (px) past which releasing dismisses. Default: 35% of width, capped at 96. */
  threshold?: number;
  /** Flick speed (px/ms) that dismisses regardless of distance. Default `0.4`. */
  velocity?: number;
  /** Movement (px) before a press becomes a swipe — below it, taps still click. Default `8`. */
  activation?: number;
  /** Turn the gesture off (keyboard/close/auto-dismiss still work). */
  disabled?: boolean;
}

/** Snap/exit animation duration in ms (0 under reduced motion). */
const DURATION = 200;

/**
 * swipeDismiss — a horizontal swipe-to-dismiss gesture for a floating element
 * (a notification). Pointer-only by nature, so it is an *enhancement*: the
 * close button and auto-dismiss remain the accessible paths. A press only
 * becomes a swipe once it moves past `activation` px and is more horizontal
 * than vertical (so taps still click and vertical scroll still scrolls). On
 * release, a drag past the distance threshold or a fast flick animates the
 * element off-screen and calls `onDismiss`; anything less snaps back.
 *
 * The action drives inline `transform`/`opacity` and a `data-swiping` /
 * `data-swipe-out` attribute pair (style the transition off while swiping, on
 * while settling). Give the element `touch-action: pan-y` so vertical scroll
 * is preserved.
 */
export const swipeDismiss: Action<HTMLElement, SwipeDismissOptions | undefined> = (
  node,
  options = {},
) => {
  let opts = options ?? {};
  const reduce =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  let pointerId: number | null = null;
  let active = false; // past the activation threshold — actually swiping

  const setDrag = (dx: number, opacity: number) => {
    node.style.transform = dx ? `translateX(${dx}px)` : "";
    node.style.opacity = opacity < 1 ? String(opacity) : "";
  };

  const settle = (dx: number, opacity: number, after?: () => void) => {
    if (reduce) {
      after?.();
      return;
    }
    node.dataset.swipeOut = "";
    requestAnimationFrame(() => setDrag(dx, opacity));
    window.setTimeout(() => {
      delete node.dataset.swipeOut;
      after?.();
    }, DURATION);
  };

  const onMove = (event: PointerEvent) => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (!active) {
      if (Math.abs(dx) < (opts.activation ?? 8)) return;
      // A mostly-vertical drag is a scroll, not a swipe: bow out.
      if (Math.abs(dy) > Math.abs(dx)) {
        pointerId = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        return;
      }
      active = true;
      node.setPointerCapture?.(event.pointerId);
      node.dataset.swiping = "";
    }

    const dt = event.timeStamp - lastTime;
    if (dt > 0) velocity = (event.clientX - lastX) / dt;
    lastX = event.clientX;
    lastTime = event.timeStamp;

    const width = node.offsetWidth || 1;
    setDrag(dx, Math.max(0, 1 - Math.abs(dx) / width));
  };

  const end = (event: PointerEvent) => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    node.releasePointerCapture?.(pointerId);
    pointerId = null;
    if (!active) return;
    active = false;
    delete node.dataset.swiping;

    const dx = event.clientX - startX;
    const width = node.offsetWidth || 1;
    const threshold = opts.threshold ?? Math.min(96, width * 0.35);
    const dismiss = Math.abs(dx) > threshold || Math.abs(velocity) > (opts.velocity ?? 0.4);

    if (dismiss && !opts.disabled) {
      const dir = dx < 0 || (dx === 0 && velocity < 0) ? -1 : 1;
      settle(dir * (width + 48), 0, () => opts.onDismiss?.());
    } else {
      settle(0, 1);
    }
  };

  const onDown = (event: PointerEvent) => {
    if (opts.disabled) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX = lastX = event.clientX;
    startY = event.clientY;
    lastTime = event.timeStamp;
    velocity = 0;
    pointerId = event.pointerId;
    active = false;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  node.addEventListener("pointerdown", onDown);
  return {
    update(next) {
      opts = next ?? {};
    },
    destroy() {
      node.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    },
  };
};
