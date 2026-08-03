import { defineComponent, h, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { useStepper, type StepperOrientation } from "./use-stepper";

/** A step's display content. */
export interface StepDescriptor {
  /** Short title (required). */
  label: string;
  /** Optional secondary line. */
  description?: string;
}

export interface StepperProps {
  steps: StepDescriptor[];
  /** Current step (0-based); bindable with `v-model:current`. */
  current?: number;
  linear?: boolean;
  orientation?: StepperOrientation;
  disabled?: boolean;
  /** Accessible name for the progress nav. Defaults to the catalog's "Progress". */
  label?: string;
  /** Called whenever the current step changes. */
  onStepChange?: (current: number) => void;
}

/** The check drawn on a completed step's indicator. */
const CheckGlyph = () =>
  h("svg", { viewBox: "0 0 16 16", width: "1em", height: "1em", focusable: "false" }, [
    h("path", {
      d: "M3.5 8.5l3 3 6-6.5",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.75",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
  ]);

/**
 * Stepper — the styled progress stepper: an ordered sequence of steps showing
 * what is complete, current, and upcoming. Ported from the Svelte adapter.
 * Behaviour (status, linear gating, navigation) comes from the headless stepper
 * in `@design-system/core`; the accessible markup is a labelled `<nav>` wrapping
 * an `<ol>`, with the current step marked `aria-current="step"`.
 *
 * Pass `steps` (their labels). In linear mode (default) upcoming steps stay
 * disabled; set `linear` to false to allow jumping to any step. The current
 * step binds two ways: `v-model:current` or the `current` prop plus
 * `onStepChange`. Completed steps show a check; the current and upcoming steps
 * show their number. Themed via `--ds-step-*`.
 */
export const Stepper = defineComponent({
  name: "Stepper",
  props: {
    steps: { type: Array as PropType<StepDescriptor[]>, required: true },
    current: { type: Number, default: 0 },
    linear: { type: Boolean, default: true },
    orientation: { type: String as PropType<StepperOrientation>, default: "horizontal" },
    disabled: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    onStepChange: { type: Function as PropType<(current: number) => void>, default: undefined },
  },
  emits: {
    "update:current": (current: number) => typeof current === "number",
  },
  setup(props, { emit }) {
    const i18n = useI18n();

    const api = useStepper(() => ({
      count: props.steps.length,
      current: props.current,
      linear: props.linear,
      orientation: props.orientation,
      disabled: props.disabled,
      onStepChange: (next: number) => {
        emit("update:current", next);
        props.onStepChange?.(next);
      },
    }));

    return () => {
      const { t } = i18n.value;
      const resolvedLabel = props.label ?? t("stepper.label");

      return h("nav", { ...api.value.rootProps, class: "stepper", "aria-label": resolvedLabel }, [
        h(
          "ol",
          { ...api.value.getListProps(), class: "stepper__list" },
          props.steps.map((step, index) => {
            const status = api.value.status(index);
            return h("li", { key: index, class: "stepper__step", "data-status": status }, [
              index > 0 ? h("span", { class: "stepper__connector", "aria-hidden": "true" }) : null,
              h("button", { ...api.value.getStepProps(index), class: "stepper__trigger" }, [
                h(
                  "span",
                  { class: "stepper__indicator", "aria-hidden": "true" },
                  status === "complete" ? [CheckGlyph()] : String(index + 1),
                ),
                h("span", { class: "stepper__text" }, [
                  h("span", { class: "stepper__label" }, step.label),
                  step.description
                    ? h("span", { class: "stepper__description" }, step.description)
                    : null,
                ]),
              ]),
            ]);
          }),
        ),
      ]);
    };
  },
});
