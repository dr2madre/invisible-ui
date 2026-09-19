import { rangeSlider as core } from "@design-system/core";
import { derived, get, writable, type Readable } from "svelte/store";
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
  /**
   * Reflect the constraints after mount: `min`, `max`, `step`, `minDistance`,
   * `orientation`, `disabled`. Reporting nothing, like any reflection: a
   * constraint is the application's data, not a user action. If the new
   * constraints leave the current pair invalid it is normalized silently,
   * the same way a drag would have been.
   */
  syncConfig: (config: RangeSliderConfig) => void;
}

/** The props a consumer may change after mount, besides the value. */
export type RangeSliderConfig = Pick<
  RangeSliderState,
  "min" | "max" | "step" | "minDistance" | "orientation" | "disabled"
>;

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

  // Work out the next state, commit it, and only then report. Reporting from
  // inside `update` would hand the consumer a store that still holds the old
  // value, and swallow anything the consumer writes from its own handler:
  // the updater's return value lands afterwards and wins.
  const setValue = (index: 0 | 1, raw: number) => {
    const current = get(state);
    if (current.disabled) return;
    const next = core.clampPair(
      current.value,
      index,
      raw,
      current.min,
      current.max,
      current.step,
      current.minDistance,
    );
    if (next[0] === current.value[0] && next[1] === current.value[1]) return;
    state.set({ ...current, value: next });
    context.onValueChange?.(next);
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

  // Every field is compared, not only the value, so a constraint that changed
  // after mount reaches the machine and the DOM instead of being frozen at
  // construction. The distance stored is the effective one, already on the
  // step grid and capped at the span, which is what the clamp reads.
  const syncConfig = (config: RangeSliderConfig) =>
    state.update((current) => {
      const minDistance = core.effectiveMinDistance(
        config.minDistance,
        config.min,
        config.max,
        config.step,
      );
      if (
        current.min === config.min &&
        current.max === config.max &&
        current.step === config.step &&
        current.minDistance === minDistance &&
        current.orientation === config.orientation &&
        current.disabled === config.disabled
      ) {
        return current;
      }
      const value = core.normalizePair(
        current.value,
        config.min,
        config.max,
        config.step,
        config.minDistance,
      );
      return {
        ...current,
        min: config.min,
        max: config.max,
        step: config.step,
        minDistance,
        orientation: config.orientation,
        disabled: config.disabled,
        value,
      };
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
    syncConfig,
  };
}
