import type { Action } from "svelte/action";

/**
 * Two overlapping native range inputs hit-test by z-order, not by distance to
 * the pointer, so whichever thumb the next press should reach must be raised
 * before the press lands. Recomputed on every pointer move over the shared
 * track: whichever thumb's value is nearer the pointer's mapped position
 * takes priority. Guarded on `event.buttons === 0`: while a button is down,
 * this must not run, or it could interrupt a drag already in progress
 * (verified against pointer capture: a native range input keeps receiving its
 * own pointer events once a drag starts on it, even past its own bounds, so
 * the guard is what keeps this action from fighting that).
 *
 * A private action: not part of the public API.
 */
export const nearestThumb: Action<
  HTMLElement,
  { lower: HTMLInputElement | null; upper: HTMLInputElement | null }
> = (node, params) => {
  let current = params;

  const onPointerMove = (event: PointerEvent) => {
    if (event.buttons !== 0) return;
    const { lower, upper } = current;
    if (!lower || !upper) return;
    const rect = node.getBoundingClientRect();
    const pct = (event.clientX - rect.left) / rect.width;
    const min = Number(lower.min);
    const max = Number(lower.max);
    const pointerValue = min + pct * (max - min);
    const lowerValue = Number(lower.value);
    const upperValue = Number(upper.value);
    const nearerLower = Math.abs(pointerValue - lowerValue) <= Math.abs(pointerValue - upperValue);
    lower.style.zIndex = nearerLower ? "2" : "1";
    upper.style.zIndex = nearerLower ? "1" : "2";
  };

  node.addEventListener("pointermove", onPointerMove);
  return {
    update(next) {
      current = next;
    },
    destroy() {
      node.removeEventListener("pointermove", onPointerMove);
    },
  };
};
