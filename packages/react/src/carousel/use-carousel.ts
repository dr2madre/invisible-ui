import { carousel as core } from "@design-system/core";
import { useId, useMemo } from "react";
import { useControllable } from "../internal/controllable";
import { keyedByDirection, type Direction } from "../internal/roving";
import { normalizeProps } from "../normalize";

export type CarouselApi = core.CarouselApi;
export type CarouselState = core.CarouselState;
export type CarouselOrientation = core.Orientation;

export interface UseCarouselOptions {
  /** Total number of slides. */
  count: number;
  /** Initial or current slide index (0-based), a controllable mirror. Defaults to `0`. */
  index?: number;
  /** Whether navigation wraps around at the ends. Defaults to `false`. */
  loop?: boolean;
  /** Arrow-key axis. Defaults to `horizontal`. */
  orientation?: CarouselOrientation;
  /** Called whenever the user moves to another slide. */
  onIndexChange?: (index: number) => void;
}

/**
 * Connect the headless carousel (WAI-ARIA carousel pattern) to React: a
 * labelled group of "N of M" slides with previous and next buttons,
 * slide-picker indicators, optional looping and arrow-key navigation. The
 * index math lives in `@design-system/core`. `index` is a controllable mirror
 * (ADR 0011), kept inside the slide count when the count shrinks; in
 * right-to-left text the left and right arrows follow the visual order.
 */
export function useCarousel({
  count,
  index: indexProp = 0,
  loop = false,
  orientation = "horizontal",
  onIndexChange,
}: UseCarouselOptions): CarouselApi {
  const id = `ds-carousel-${useId()}`;
  const [own, setIndex, syncIndex] = useControllable(indexProp, onIndexChange);
  // A shrinking count clamps the index into it, silently and for good.
  const index = core.clampIndex(own, count);
  if (index !== own) syncIndex(index);

  return useMemo(() => {
    const connect = (direction: Direction) =>
      core.connect({
        state: { index, count, loop, orientation, id },
        setIndex,
        direction,
        normalize: normalizeProps,
      });
    const ltr = connect("ltr");
    return {
      ...ltr,
      rootProps: keyedByDirection(ltr.rootProps, () => connect("rtl").rootProps),
    };
  }, [index, count, loop, orientation, id, setIndex]);
}
