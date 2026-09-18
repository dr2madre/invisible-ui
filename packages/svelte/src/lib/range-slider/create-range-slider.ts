import { rangeSlider as core } from "@design-system/core";
import { derived, writable, type Readable } from "svelte/store";
import { normalizeProps } from "../normalize";
import { stableId } from "../internal/stable-id";

export type RangeSliderApi = core.RangeSliderApi;
export type RangeSliderState = core.RangeSliderState;
export type RangeSliderContext = core.RangeSliderContext;

export interface CreateRangeSlider {
  /** Reactive resolved state. */
  state: Readable<RangeSliderState>;
  /**
   * Reactive connected API (prop bags for each part). Every bag here is
   * plain attributes, with no event handler: the component applies them with
   * a reactive `{...$api.xProps}` spread directly in the markup (the same
   * shape `Field` already uses), not a `use:` action. This also makes the
   * server-rendered markup correct before hydration, since a spread renders
   * during SSR and an action does not run until the browser mounts the node.
   */
  api: Readable<RangeSliderApi>;
  /** `[lower, upper]`. */
  value: Readable<readonly [number, number]>;
  /** `[lowerPercentage, upperPercentage]`, each 0-100. */
  percentages: Readable<readonly [number, number]>;
  /** Request a new raw value for one thumb (snapped, clamped against the
   * other; ignored while disabled). */
  setValue: (index: 0 | 1, raw: number) => void;
  /**
   * Reflect a controlled `value` prop without reporting a change. Normalized
   * the same way a user's own drag would be, atomically across both
   * positions: a pair matching the control's last report in only one
   * position is not a give-back, and is taken as the application's own
   * choice.
   */
  syncValue: (value: readonly [number, number]) => void;
}

/**
 * Create a headless range slider backed by two native `<input type="range">`
 * elements. The browser owns each thumb's own slider role, ARIA value,
 * keyboard and pointer dragging; this adapter owns the pair as a whole: which
 * thumb is which, the clamp that keeps them from crossing, and reporting the
 * complete pair exactly once per real change.
 */
export function createRangeSlider(context: core.RangeSliderContext = {}): CreateRangeSlider {
  const state = writable<RangeSliderState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-range-slider") }),
  );

  const setValue = (index: 0 | 1, raw: number) => {
    state.update((current) => {
      if (current.disabled) return current;
      const next = core.clampPair(
        current.value,
        index,
        raw,
        current.min,
        current.max,
        current.step,
        current.minDistance,
      );
      if (next[0] === current.value[0] && next[1] === current.value[1]) return current;
      context.onValueChange?.(next);
      return { ...current, value: next };
    });
  };

  // Reflecting a controlled prop is normalized the same way a user's own
  // drag is, so the control never shows a pair it could not reach itself.
  const syncValue = (next: readonly [number, number]) =>
    state.update((current) => {
      if (!Number.isFinite(next[0]) || !Number.isFinite(next[1])) return current;
      const normalized = core.normalizePair(
        next,
        current.min,
        current.max,
        current.step,
        current.minDistance,
      );
      if (normalized[0] === current.value[0] && normalized[1] === current.value[1]) return current;
      return { ...current, value: normalized };
    });

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setValue, normalize: normalizeProps }),
  );

  return {
    state,
    api,
    value: derived(state, ($state) => $state.value),
    percentages: derived(state, ($state) => core.percentages($state)),
    setValue,
    syncValue,
  };
}
