import { rangeSlider as core } from "@design-system/core";
import type { Action } from "svelte/action";

/**
 * Two overlapping native range inputs hit-test by z-order, not by distance to
 * the pointer, so whichever thumb the next press should reach must be raised
 * before the press lands. The rule itself lives in core (`nearerThumb`,
 * `restingThumb`); this action feeds it what only the DOM knows: the track's
 * box and the input's computed writing direction, which decide which
 * physical end is `min`.
 *
 * Two moments raise a thumb. A pointer moving over the track picks the one
 * nearer the pointer along the logical axis (horizontal LTR or RTL, or
 * vertical), guarded on `event.buttons === 0` so a drag in progress is never
 * interrupted (a native range input keeps receiving its own pointer events
 * once a drag starts on it, even past its own bounds). And a value or
 * orientation change with no pointer over the track applies the resting
 * rule, so a touch, which has no hover before it, still lands on a thumb that
 * can move: stacked at `max` that is the lower one, otherwise the upper.
 *
 * A private action: not part of the public API.
 */
export const nearestThumb: Action<
  HTMLElement,
  {
    lower: HTMLInputElement | null;
    upper: HTMLInputElement | null;
    value: readonly [number, number];
    orientation: core.Orientation;
  }
> = (node, params) => {
  let current = params;
  let hovering = false;

  const raise = (index: 0 | 1) => {
    const { lower, upper } = current;
    if (!lower || !upper) return;
    lower.style.zIndex = index === 0 ? "2" : "1";
    upper.style.zIndex = index === 1 ? "2" : "1";
  };

  const fractions = (): [number, number] | null => {
    const { lower, upper } = current;
    if (!lower || !upper) return null;
    const min = Number(lower.min);
    const max = Number(lower.max);
    return [
      core.valueFraction(Number(lower.value), min, max),
      core.valueFraction(Number(upper.value), min, max),
    ];
  };

  const rest = () => {
    const pair = fractions();
    if (pair) raise(core.restingThumb(pair[0], pair[1]));
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.buttons !== 0) return;
    const { lower } = current;
    const pair = fractions();
    if (!lower || !pair) return;
    const styles = getComputedStyle(lower);
    const axis: core.PointerAxis = {
      orientation: styles.writingMode.startsWith("vertical") ? "vertical" : "horizontal",
      rtl: styles.direction === "rtl",
    };
    const pointer = core.pointerFraction(
      axis,
      node.getBoundingClientRect(),
      event.clientX,
      event.clientY,
    );
    raise(core.nearerThumb(pointer, pair[0], pair[1]));
  };
  const onPointerEnter = () => {
    hovering = true;
  };
  const onPointerLeave = () => {
    hovering = false;
    rest();
  };

  node.addEventListener("pointermove", onPointerMove);
  node.addEventListener("pointerenter", onPointerEnter);
  node.addEventListener("pointerleave", onPointerLeave);
  rest();

  return {
    update(next) {
      current = next;
      if (!hovering) rest();
    },
    destroy() {
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerenter", onPointerEnter);
      node.removeEventListener("pointerleave", onPointerLeave);
    },
  };
};
