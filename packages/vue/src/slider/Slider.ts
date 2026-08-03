import { defineComponent, h, type PropType } from "vue";
import { useSlider, type SliderOrientation } from "./use-slider";

export interface SliderProps {
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: number;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  orientation?: SliderOrientation;
  disabled?: boolean;
  /** Accessible name for the slider (required). */
  label: string;
  /** Form field name; the value is submitted under it. */
  name?: string;
  /** Show the current value to the side of the track. */
  showValue?: boolean;
  /** Show the min and max reference values under the ends of the track. */
  showRange?: boolean;
  /** Show tick marks at each step (drawn only when the count stays readable). */
  ticks?: boolean;
  /** Format the displayed value/range (e.g. add a unit). */
  format?: (value: number) => string;
  /** Called whenever the value changes. */
  onValueChange?: (value: number) => void;
}

// Above this many steps the ticks would crowd into a solid line, so they are
// dropped instead.
const MAX_TICKS = 20;

/**
 * Slider — a styled single-thumb slider built on a native
 * `<input type="range">`, ported from the Svelte adapter. The browser provides
 * the slider role, ARIA value, keyboard control (arrows / Page / Home / End),
 * pointer dragging, focus and form participation; this layer styles the track,
 * the filled portion and the thumb.
 *
 * The value binds two ways: `v-model` or the `value` prop plus
 * `onValueChange`. Provide a `label` for the accessible name; the `icon` slot
 * adds a leading glyph. Colors, sizing and the thumb are themeable via
 * `--ds-slider-*`.
 */
export const Slider = defineComponent({
  name: "Slider",
  props: {
    modelValue: { type: Number, default: undefined },
    value: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    orientation: { type: String as PropType<SliderOrientation>, default: "horizontal" },
    disabled: { type: Boolean, default: false },
    label: { type: String, required: true },
    name: { type: String, default: undefined },
    showValue: { type: Boolean, default: false },
    showRange: { type: Boolean, default: false },
    ticks: { type: Boolean, default: false },
    format: {
      type: Function as PropType<(value: number) => string>,
      default: (value: number) => String(value),
    },
    onValueChange: { type: Function as PropType<(value: number) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: number) => typeof value === "number",
  },
  setup(props, { emit, slots }) {
    const api = useSlider(() => ({
      value: props.modelValue ?? props.value,
      min: props.min,
      max: props.max,
      step: props.step,
      orientation: props.orientation,
      disabled: props.disabled,
      onValueChange: (next: number) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
    }));

    return () => {
      const { value, min, max, step, percentage } = api.value;
      const tickCount = step > 0 ? Math.round((max - min) / step) : 0;
      const tickPositions =
        props.ticks && tickCount > 0 && tickCount <= MAX_TICKS
          ? Array.from({ length: tickCount + 1 }, (_, i) => (i / tickCount) * 100)
          : [];

      return h("div", { class: ["slider-field", { "slider-field--disabled": props.disabled }] }, [
        h("div", { class: "slider-field__row" }, [
          slots.icon
            ? h("span", { class: "slider-field__icon", "aria-hidden": "true" }, slots.icon())
            : null,
          h(
            "span",
            {
              class: ["slider", { "slider--disabled": props.disabled }],
              "data-orientation": props.orientation,
              style: { "--ds-slider-pct": `${percentage}%` },
            },
            [
              h("input", {
                ...api.value.inputProps,
                class: "slider__input",
                name: props.name,
                "aria-label": props.label,
                value,
              }),
              tickPositions.length
                ? h(
                    "span",
                    { class: "slider__ticks", "aria-hidden": "true" },
                    tickPositions.map((position) =>
                      h("span", {
                        key: position,
                        class: "slider__tick",
                        style: { insetInlineStart: `${position}%` },
                      }),
                    ),
                  )
                : null,
            ],
          ),
          props.showValue
            ? h("output", { class: "slider-field__value" }, props.format(value))
            : null,
        ]),
        props.showRange
          ? h("div", { class: "slider-field__range", "aria-hidden": "true" }, [
              h("span", props.format(min)),
              h("span", props.format(max)),
            ])
          : null,
      ]);
    };
  },
});
