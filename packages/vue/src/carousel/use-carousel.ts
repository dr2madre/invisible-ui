import { carousel as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";

export type CarouselApi = core.CarouselApi;
export type CarouselState = core.CarouselState;
export type CarouselOrientation = core.Orientation;

export interface UseCarouselOptions {
  /** Total number of slides. */
  count: number;
  /** Current slide index (0-based), controlled. Defaults to `0`. */
  index?: number;
  /** Whether navigation wraps around at the ends. Defaults to `false`. */
  loop?: boolean;
  /** Arrow-key axis. Defaults to `horizontal`. */
  orientation?: CarouselOrientation;
  /** Called whenever the current slide changes. */
  onIndexChange?: (index: number) => void;
}

/**
 * Connect the headless carousel (WAI-ARIA carousel pattern) to Vue: a labelled
 * group of "N of M" slides with previous/next buttons, slide-picker indicators,
 * optional looping and arrow-key navigation. The index math lives in
 * `@design-system/core`; this composable owns the current index (mirrored by a
 * `watch`) and derives the connected props with `computed(connect)`. The styled
 * layer maps the index to a transform (slide mode) or scrolls the active slide
 * into view (gallery mode).
 */
export function useCarousel(
  options: MaybeRefOrGetter<UseCarouselOptions>,
): ComputedRef<CarouselApi> {
  const resolved = computed(() => toValue(options));
  // One seeding pass fixes the id, so later states reuse it instead of drawing
  // a fresh one from the core's counter on every recompute.
  const seed = core.initialState(resolved.value);
  const index = ref(seed.index);

  watch(
    () => resolved.value.index,
    (next) => {
      if (next != null) index.value = next;
    },
  );

  // The slide count can change while mounted; keep the index inside the range.
  watch(
    () => resolved.value.count,
    (count) => {
      index.value = core.clampIndex(index.value, count);
    },
  );

  const setIndex = (next: number) => {
    if (index.value === next) return;
    index.value = next;
    resolved.value.onIndexChange?.(next);
  };

  return computed(() =>
    core.connect({
      state: core.initialState({ ...resolved.value, id: seed.id, index: index.value }),
      setIndex,
      normalize: normalizeProps,
    }),
  );
}
