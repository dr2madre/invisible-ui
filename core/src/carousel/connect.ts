import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { canGoNext, canGoPrev, clampIndex, nextIndex, prevIndex } from "./state";
import type { CarouselState } from "./types";

/** The public, framework-agnostic API for a connected carousel. */
export interface CarouselApi {
  /** Current slide index (0-based). */
  index: number;
  /** Total number of slides. */
  count: number;
  /** Whether forward/back navigation is currently possible. */
  canGoNext: boolean;
  canGoPrev: boolean;
  /** Advance one slide (wraps when `loop`). */
  next(): void;
  /** Go back one slide (wraps when `loop`). */
  prev(): void;
  /** Jump to a slide (clamped). */
  goTo(index: number): void;
  /** Props for the carousel container (`role="group"`, `aria-roledescription`). */
  rootProps: ElementProps;
  /** Props for the slides track/viewport. */
  getViewportProps(): ElementProps;
  /** Props for a single slide, by index. */
  getSlideProps(index: number): ElementProps;
  /** Props for the "previous" button. */
  getPrevProps(): ElementProps;
  /** Props for the "next" button. */
  getNextProps(): ElementProps;
  /** Props for a slide-picker indicator ("dot"), by index. */
  getIndicatorProps(index: number): ElementProps;
}

export interface ConnectOptions {
  /** Current resolved state. */
  state: CarouselState;
  /** Request a new current index; the adapter owns how state updates. */
  setIndex: (index: number) => void;
  /** Framework adapter's prop normaliser. Defaults to identity. */
  normalize?: Normalize;
}

/**
 * Connect carousel state to prop getters following the WAI-ARIA carousel pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/): a labelled group with
 * `aria-roledescription="carousel"`, slides marked `aria-roledescription="slide"`
 * and named "N of M", previous/next buttons, and an optional set of slide-picker
 * indicators. Keyboard arrows on the container move between slides.
 */
export function connect({
  state,
  setIndex,
  normalize = identityNormalize,
}: ConnectOptions): CarouselApi {
  const { index, count, orientation, id } = state;

  const go = (target: number) => {
    const clamped = clampIndex(target, count);
    if (clamped !== index) setIndex(clamped);
  };
  const next = () => go(nextIndex(state));
  const prev = () => go(prevIndex(state));

  const forwardKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
  const backKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";

  return {
    index,
    count,
    canGoNext: canGoNext(state),
    canGoPrev: canGoPrev(state),
    next,
    prev,
    goTo: go,
    rootProps: normalize({
      role: "group",
      "aria-roledescription": "carousel",
      "data-orientation": orientation,
      onKeyDown: (event: Event) => {
        const key = (event as KeyboardEvent).key;
        if (key === forwardKey) {
          event.preventDefault();
          next();
        } else if (key === backKey) {
          event.preventDefault();
          prev();
        }
      },
    }),
    getViewportProps: () =>
      normalize({
        id: `${id}-viewport`,
        "aria-live": "polite",
        "data-orientation": orientation,
      }),
    getSlideProps: (i: number) => {
      const active = i === index;
      return normalize({
        role: "group",
        id: `${id}-slide-${i}`,
        "aria-roledescription": "slide",
        "aria-label": `${i + 1} of ${count}`,
        "data-active": active ? "" : undefined,
        "data-index": String(i),
      });
    },
    getPrevProps: () => {
      const enabled = canGoPrev(state);
      return normalize({
        type: "button",
        disabled: enabled ? undefined : true,
        "aria-controls": `${id}-viewport`,
        "data-disabled": enabled ? undefined : "",
        onClick: () => prev(),
      });
    },
    getNextProps: () => {
      const enabled = canGoNext(state);
      return normalize({
        type: "button",
        disabled: enabled ? undefined : true,
        "aria-controls": `${id}-viewport`,
        "data-disabled": enabled ? undefined : "",
        onClick: () => next(),
      });
    },
    getIndicatorProps: (i: number) => {
      const current = i === index;
      return normalize({
        type: "button",
        "aria-controls": `${id}-viewport`,
        "aria-current": current ? "true" : undefined,
        "data-selected": current ? "" : undefined,
        "data-index": String(i),
        onClick: () => go(i),
      });
    },
  };
}
