import { defineComponent, h, watch, type PropType } from "vue";
import { useProgress } from "./use-progress";

export interface ProgressProps {
  /** Current value (determinate — see Loading for indeterminate waiting). */
  value?: number;
  /** Minimum value. */
  min?: number;
  /** Maximum value. */
  max?: number;
  /** Shape: a linear `bar` (default) or a `circle` ring (upload/export). */
  shape?: "bar" | "circle";
  /** Show the percentage inside the circle (determinate `circle` only). */
  showValue?: boolean;
  /** Accessible name for the progress bar (required). */
  label: string;
}

// r=15.9155 makes the circumference 100, so dasharray maps 1:1 to percent.
const R = 15.9155;

/**
 * Progress — a styled, **determinate** progress (WAI-ARIA progressbar
 * pattern), ported from the Svelte adapter: a track with a fill that
 * represents a value against a reference — completion of user-driven steps,
 * gamification, analytics. Behaviour and accessibility (role, aria-value*)
 * come from the headless progress (`@design-system/core`).
 *
 * Deliberately no indeterminate state: something that sweeps or spins
 * without a value is *waiting*, and waiting is the Loading family's job
 * (which reuses this same anatomy and adds time/percentage feedback).
 *
 * Provide a `label` for the accessible name. Colors, height and radius are
 * themeable via `--ds-progress-*`.
 */
export const Progress = defineComponent({
  name: "Progress",
  props: {
    value: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    shape: { type: String as PropType<"bar" | "circle">, default: "bar" },
    showValue: { type: Boolean, default: false },
    label: { type: String, required: true },
  },
  setup(props) {
    const { api, percentage, setValue } = useProgress({
      value: props.value,
      min: props.min,
      max: props.max,
    });
    watch(
      () => props.value,
      (value) => setValue(value),
    );

    return () => {
      const pct = percentage.value ?? 0;

      if (props.shape === "circle") {
        return h(
          "div",
          {
            ...api.value.rootProps,
            class: "progress progress--circle",
            "aria-label": props.label,
          },
          [
            h("svg", { viewBox: "0 0 36 36", "aria-hidden": "true", focusable: "false" }, [
              h("circle", { class: "progress__track", cx: "18", cy: "18", r: R }),
              h("circle", {
                ...api.value.indicatorProps,
                class: "progress__ring",
                cx: "18",
                cy: "18",
                r: R,
                style: { strokeDasharray: `${pct} 100` },
              }),
            ]),
            props.showValue ? h("span", { class: "progress__value" }, `${Math.round(pct)}%`) : null,
          ],
        );
      }

      return h("div", { ...api.value.rootProps, class: "progress", "aria-label": props.label }, [
        h("div", {
          ...api.value.indicatorProps,
          class: "progress__indicator",
          style: { inlineSize: `${pct}%` },
        }),
      ]);
    };
  },
});
