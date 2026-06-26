import type { CarouselContext, CarouselState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: CarouselContext): CarouselState {
  return {
    count: context.count,
    index: clampIndex(context.index ?? 0, context.count),
    loop: context.loop ?? false,
    orientation: context.orientation ?? "horizontal",
    id: context.id ?? `ds-carousel-${++idCounter}`,
  };
}

/** Clamp an index into `[0, count - 1]` (or `0` when there are no slides). */
export function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

/** The index after moving one slide forward (wrapping when `loop`). */
export function nextIndex(state: CarouselState): number {
  const { index, count, loop } = state;
  if (count <= 0) return 0;
  if (index >= count - 1) return loop ? 0 : index;
  return index + 1;
}

/** The index after moving one slide back (wrapping when `loop`). */
export function prevIndex(state: CarouselState): number {
  const { index, count, loop } = state;
  if (count <= 0) return 0;
  if (index <= 0) return loop ? count - 1 : index;
  return index - 1;
}

/** Whether moving forward is currently possible. */
export function canGoNext(state: CarouselState): boolean {
  return state.loop || state.index < state.count - 1;
}

/** Whether moving back is currently possible. */
export function canGoPrev(state: CarouselState): boolean {
  return state.loop || state.index > 0;
}
