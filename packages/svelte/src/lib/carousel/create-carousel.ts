import { carousel as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type Orientation = core.Orientation;
export type CarouselApi = core.CarouselApi;
export type CarouselState = core.CarouselState;
export type CarouselContext = core.CarouselContext;

export interface CreateCarousel {
  /** Reactive resolved state. */
  state: Readable<CarouselState>;
  /** Reactive connected API. */
  api: Readable<CarouselApi>;
  /** Current slide index (0-based). */
  index: Readable<number>;
  /** Advance one slide. */
  next: () => void;
  /** Go back one slide. */
  prev: () => void;
  /** Jump to a slide. */
  goTo: (index: number) => void;
  /**
   * Reflect `count`, `loop` and `orientation` changed after mount, silently.
   * A carousel fed by a fetch or a filter changes its slide count; the index
   * is clamped into the new count so the active slide never points past the
   * last one. The orientation decides which arrow keys move the carousel.
   */
  syncConfig: (config: { count: number; loop: boolean; orientation: Orientation }) => void;
  /** Action for the container: `<section use:rootAction>`. */
  rootAction: Action<HTMLElement>;
  /** Action for the slides track/viewport: `<div use:viewportAction>`. */
  viewportAction: Action<HTMLElement>;
  /** Action for a slide: `<div use:slideAction={index}>`. */
  slideAction: Action<HTMLElement, number>;
  /** Action for the previous button. */
  prevAction: Action<HTMLElement>;
  /** Action for the next button. */
  nextAction: Action<HTMLElement>;
  /** Action for a slide-picker indicator: `<button use:indicatorAction={index}>`. */
  indicatorAction: Action<HTMLElement, number>;
}

/**
 * Create a headless carousel (WAI-ARIA carousel pattern): a labelled group of
 * "N of M" slides with previous/next buttons, slide-picker indicators, optional
 * looping and arrow-key navigation. The index math lives in `@design-system/core`;
 * this adapter wires state to Svelte stores and applies the connected props via
 * actions. The styled layer maps the current index to a transform (slide mode) or
 * scrolls the active slide into view (gallery mode).
 */
export function createCarousel(context: CarouselContext): CreateCarousel {
  const state = writable<CarouselState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-carousel") }),
  );

  const setIndex = (index: number) => {
    const current = get(state);
    if (current.index === index) return;
    state.set({ ...current, index });
    context.onIndexChange?.(index);
  };

  const syncConfig = (config: { count: number; loop: boolean; orientation: Orientation }) => {
    const current = get(state);
    const index = core.clampIndex(current.index, config.count);
    // Writing the same values back would still wake every subscriber, so a
    // config that changed nothing writes nothing.
    if (
      current.count === config.count &&
      current.loop === config.loop &&
      current.orientation === config.orientation &&
      current.index === index
    ) {
      return;
    }
    state.set({
      ...current,
      count: config.count,
      loop: config.loop,
      orientation: config.orientation,
      index,
    });
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setIndex, normalize: normalizeProps }),
  );

  const rootAction = createPropsAction(api, (a) => a.rootProps);
  const viewportAction = createPropsAction(api, (a) => a.getViewportProps());
  const prevAction = createPropsAction(api, (a) => a.getPrevProps());
  const nextAction = createPropsAction(api, (a) => a.getNextProps());

  const slideAction: Action<HTMLElement, number> = (node, index) => {
    const slideApi = derived(api, (a) => a.getSlideProps(index as number));
    const handle = createPropsAction(slideApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  const indicatorAction: Action<HTMLElement, number> = (node, index) => {
    const indApi = derived(api, (a) => a.getIndicatorProps(index as number));
    const handle = createPropsAction(indApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return {
    state,
    api,
    index: derived(state, ($state) => $state.index),
    next: () => get(api).next(),
    prev: () => get(api).prev(),
    goTo: (index: number) => get(api).goTo(index),
    syncConfig,
    rootAction,
    viewportAction,
    slideAction,
    prevAction,
    nextAction,
    indicatorAction,
  };
}
