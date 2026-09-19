import { rangeSlider as core } from "@design-system/core";
import { defineComponent, h, onMounted, ref, watch, type PropType } from "vue";
import { useRangeSlider, type RangeSliderOrientation } from "./use-range-slider";
import { useFormReset, useLiveDom } from "../internal/form-reset";
import { useI18n } from "../i18n/i18n";

export interface RangeSliderProps {
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: readonly [number, number];
  value?: readonly [number, number];
  min?: number;
  max?: number;
  step?: number;
  /** The gap the two thumbs may not close. They may touch; they never cross. */
  minDistance?: number;
  orientation?: RangeSliderOrientation;
  disabled?: boolean;
  /** Accessible name for the group (required). */
  label: string;
  /** Accessible name for each thumb: `[lowerLabel, upperLabel]`. */
  thumbLabels: readonly [string, string];
  /** Form field name — both thumbs submit under it, in order:
   * `FormData.getAll(name)` reads `[String(lower), String(upper)]`. */
  name?: string;
  /** Show the current values to the side of the track. */
  showValue?: boolean;
  /** Show the min and max reference values under the ends of the track. */
  showRange?: boolean;
  /** Show tick marks at each step (only when the count is reasonable). */
  ticks?: boolean;
  /** Format a displayed value (e.g. add a unit). */
  format?: (value: number) => string;
  /** Called with the complete pair whenever it changes. */
  onValueChange?: (value: readonly [number, number]) => void;
}

const MAX_TICKS = 20;

const isSamePair = (a: readonly [number, number], b: readonly [number, number]): boolean =>
  a[0] === b[0] && a[1] === b[1];

/**
 * RangeSlider — a styled two-thumb slider built on two **native**
 * `<input type="range">` elements sharing one track, ported from the Svelte
 * adapter. The browser provides each thumb's own slider role, ARIA value,
 * keyboard control (arrows / Page / Home / End), pointer dragging, focus and
 * form participation; this layer styles the track, the fill between the
 * thumbs and the two thumbs, and keeps them from crossing.
 *
 * A separate component from `Slider`, not a mode on it: the value is a pair,
 * and every operation (the clamp, the dependent bound, reporting) works on
 * the pair as a whole.
 *
 * The value binds two ways: `v-model` or the `value` prop plus
 * `onValueChange`. Provide `label` for the group's accessible name and
 * `thumbLabels` for each thumb's own name — there is no universal word for
 * "the lower one" to fall back to. Colors, sizing and the thumbs are
 * themeable via `--ds-range-slider-*`.
 */
export const RangeSlider = defineComponent({
  name: "RangeSlider",
  props: {
    modelValue: {
      type: Array as unknown as PropType<readonly [number, number]>,
      default: undefined,
    },
    value: {
      type: Array as unknown as PropType<readonly [number, number]>,
      default: () => [0, 100],
    },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    minDistance: { type: Number, default: 0 },
    orientation: { type: String as PropType<RangeSliderOrientation>, default: "horizontal" },
    disabled: { type: Boolean, default: false },
    label: { type: String, required: true },
    thumbLabels: { type: Array as unknown as PropType<readonly [string, string]>, required: true },
    name: { type: String, default: undefined },
    showValue: { type: Boolean, default: false },
    showRange: { type: Boolean, default: false },
    ticks: { type: Boolean, default: false },
    format: {
      type: Function as PropType<(value: number) => string>,
      default: (value: number) => String(value),
    },
    onValueChange: {
      type: Function as PropType<(value: readonly [number, number]) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:modelValue": (value: readonly [number, number]) => Array.isArray(value),
  },
  setup(props, { emit, slots }) {
    const lowerInput = ref<HTMLInputElement | null>(null);
    const upperInput = ref<HTMLInputElement | null>(null);
    const track = ref<HTMLElement | null>(null);
    const i18n = useI18n();

    const given = (): readonly [number, number] => props.modelValue ?? props.value;
    // The reset default is normalized the same way a user's own drag would
    // be, so a native reset can never restore an invalid pair (an invalid
    // default like [50, 52] with a minDistance of 10 would otherwise reset
    // the DOM to an invalid pair with no script running).
    const normalized = (pair: readonly [number, number]): readonly [number, number] =>
      core.normalizePair(pair, props.min, props.max, props.step, props.minDistance);
    // What the composable is told: a reset writes the default here, which is
    // its silent path (the watch, not the setter).
    const told = ref<readonly [number, number]>(given());
    // The reset default follows the prop, except a give-back of what the
    // control itself reported (ADR 0012), compared atomically across both
    // positions: a pair matching the control's last report in only one
    // position is not a give-back, and is taken as the application's own
    // choice.
    const fallback = ref<readonly [number, number]>(normalized(given()));
    watch(given, (next) => {
      if (!isSamePair(next, told.value)) fallback.value = normalized(next);
      told.value = next;
    });
    // The reset default follows the constraints too, so a native reset can
    // never put back a pair the current constraints would not allow.
    watch(
      () => [props.min, props.max, props.step, props.minDistance] as const,
      () => {
        const next = normalized(fallback.value);
        if (!isSamePair(next, fallback.value)) fallback.value = next;
      },
    );

    const api = useRangeSlider(() => ({
      value: told.value,
      min: props.min,
      max: props.max,
      step: props.step,
      minDistance: props.minDistance,
      orientation: props.orientation,
      disabled: props.disabled,
      onValueChange: (next: readonly [number, number]) => {
        told.value = next;
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    // The attribute carries the default, so a native reset and a no-script
    // render both have one; the property carries what the user sees.
    useLiveDom(lowerInput, () => ({ value: String(api.value.value[0]) }));
    useLiveDom(upperInput, () => ({ value: String(api.value.value[1]) }));
    // One anchor is enough: the reset event is form-wide, and restoring puts
    // the whole pair back at once. Each input's own default attribute is
    // what actually moves its DOM value; this only re-syncs the composable's
    // state and the v-model binding to match.
    useFormReset(
      () => lowerInput.value,
      () => {
        told.value = fallback.value;
        emit("update:modelValue", fallback.value);
      },
    );

    // Two overlapping native range inputs hit-test by z-order, not by
    // distance to the pointer, so whichever thumb the next press should reach
    // must be raised before the press lands. The rule lives in core
    // (`nearerThumb`, `restingThumb`); this feeds it what only the DOM knows:
    // the track's box and the input's computed writing direction, which
    // decide which physical end is `min`. A pointer over the track picks the
    // nearer thumb along the logical axis, guarded on `event.buttons === 0`
    // so a drag in progress is never interrupted; with no pointer over the
    // track the resting rule applies, so a touch, which has no hover before
    // it, still lands on a thumb that can move.
    let hovering = false;
    const raise = (index: 0 | 1) => {
      const lower = lowerInput.value;
      const upper = upperInput.value;
      if (!lower || !upper) return;
      lower.style.zIndex = index === 0 ? "2" : "1";
      upper.style.zIndex = index === 1 ? "2" : "1";
    };
    const fractions = (): [number, number] | null => {
      const lower = lowerInput.value;
      const upper = upperInput.value;
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
    const onTrackPointerMove = (event: PointerEvent) => {
      if (event.buttons !== 0) return;
      const lower = lowerInput.value;
      const node = track.value;
      const pair = fractions();
      if (!lower || !node || !pair) return;
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
    const onTrackPointerEnter = () => {
      hovering = true;
    };
    const onTrackPointerLeave = () => {
      hovering = false;
      rest();
    };
    onMounted(rest);
    watch(
      () => [api.value.value[0], api.value.value[1], props.orientation] as const,
      () => {
        if (!hovering) rest();
      },
      { flush: "post" },
    );

    return () => {
      const { t } = i18n.value;
      const { value, min, max, step, minDistance, percentages } = api.value;
      const tickCount = step > 0 ? Math.round((max - min) / step) : 0;
      const tickPositions =
        props.ticks && tickCount > 0 && tickCount <= MAX_TICKS
          ? Array.from({ length: tickCount + 1 }, (_, i) => (i / tickCount) * 100)
          : [];

      return h(
        "div",
        {
          class: ["range-slider-field", { "range-slider-field--disabled": props.disabled }],
          "data-orientation": props.orientation,
        },
        [
          h("div", { class: "range-slider-field__row" }, [
            slots.icon
              ? h(
                  "span",
                  { class: "range-slider-field__icon", "aria-hidden": "true" },
                  slots.icon(),
                )
              : null,
            h(
              "div",
              {
                class: ["range-slider", { "range-slider--disabled": props.disabled }],
                "data-orientation": props.orientation,
                "aria-label": props.label,
                role: "group",
                style: {
                  "--_range-lower-pct": `${percentages[0]}%`,
                  "--_range-upper-pct": `${percentages[1]}%`,
                },
              },
              [
                h(
                  "div",
                  {
                    class: "range-slider__track",
                    ref: track,
                    onPointermove: onTrackPointerMove,
                    onPointerenter: onTrackPointerEnter,
                    onPointerleave: onTrackPointerLeave,
                  },
                  [
                    h("span", { class: "range-slider__range", "aria-hidden": "true" }),
                    tickPositions.length
                      ? h(
                          "span",
                          { class: "range-slider__ticks", "aria-hidden": "true" },
                          tickPositions.map((position) =>
                            h("span", {
                              key: position,
                              class: "range-slider__tick",
                              style: { "--_tick-pct": `${position}%` },
                            }),
                          ),
                        )
                      : null,
                    h("input", {
                      ...api.value.getThumbProps(0),
                      ref: lowerInput,
                      class: "range-slider__input",
                      name: props.name,
                      "aria-label": props.thumbLabels[0],
                      "aria-valuetext": t("rangeSlider.lowerText", {
                        value: props.format(value[0]),
                        bound: props.format(value[1] - minDistance),
                      }),
                      // The attribute is the default; `useLiveDom` writes the
                      // property the user drags.
                      "^value": fallback.value[0],
                      onInput: (event: Event) =>
                        api.value.setValue(0, Number((event.target as HTMLInputElement).value)),
                    }),
                    h("input", {
                      ...api.value.getThumbProps(1),
                      ref: upperInput,
                      class: "range-slider__input",
                      name: props.name,
                      "aria-label": props.thumbLabels[1],
                      "aria-valuetext": t("rangeSlider.upperText", {
                        value: props.format(value[1]),
                        bound: props.format(value[0] + minDistance),
                      }),
                      "^value": fallback.value[1],
                      onInput: (event: Event) =>
                        api.value.setValue(1, Number((event.target as HTMLInputElement).value)),
                    }),
                  ],
                ),
              ],
            ),
            props.showValue
              ? h(
                  "output",
                  { class: "range-slider-field__value" },
                  `${props.format(value[0])} – ${props.format(value[1])}`,
                )
              : null,
          ]),
          props.showRange
            ? h("div", { class: "range-slider-field__range", "aria-hidden": "true" }, [
                h("span", props.format(min)),
                h("span", props.format(max)),
              ])
            : null,
        ],
      );
    };
  },
});
