import { defineComponent, h, type PropType } from "vue";
import { usePinInput, type PinInputType } from "./use-pin-input";

export interface PinInputProps {
  /** `v-model` value; takes precedence over `value` when bound. */
  modelValue?: string;
  value?: string;
  length?: number;
  /** Allowed characters. */
  type?: PinInputType;
  /** Render cells masked (like a password). */
  mask?: boolean;
  disabled?: boolean;
  /** Validation state; colors the cells (red ring) and signals errors. */
  invalid?: boolean;
  /** Validation success; colors the cells green (e.g. a verified code). */
  success?: boolean;
  /** Form field name; the combined code is submitted under it. */
  name?: string;
  /** Accessible name for the group of cells (required). */
  label: string;
  /** Called whenever the combined value changes. */
  onValueChange?: (value: string) => void;
  /** Called once all cells are filled. */
  onComplete?: (value: string) => void;
}

/**
 * PinInput — a styled OTP / verification-code input, ported from the Svelte
 * adapter: a row of single-character cells. Behaviour and accessibility
 * (per-cell entry, advance/backspace, arrow movement, paste distribution,
 * character filtering) come from the headless PIN input
 * (`@design-system/core`).
 *
 * The code binds two ways: `v-model` or the `value` prop plus `onValueChange`;
 * `onComplete` fires once every cell is filled. Provide a `label` for the
 * group's accessible name. Sizing, colors and radius are themeable via
 * `--ds-pin-input-*`.
 */
export const PinInput = defineComponent({
  name: "PinInput",
  props: {
    modelValue: { type: String, default: undefined },
    value: { type: String, default: "" },
    length: { type: Number, default: 6 },
    type: { type: String as PropType<PinInputType>, default: "numeric" },
    mask: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    invalid: { type: Boolean, default: false },
    success: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    label: { type: String, required: true },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
    onComplete: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit }) {
    const { api, values, value, rootRef } = usePinInput(() => ({
      value: props.modelValue ?? props.value,
      length: props.length,
      type: props.type,
      mask: props.mask,
      disabled: props.disabled,
      onValueChange: (next: string) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
      onComplete: (next: string) => props.onComplete?.(next),
    }));

    return () =>
      h(
        "div",
        {
          ...api.value.rootProps,
          ref: rootRef,
          class: "pin-input",
          "aria-label": props.label,
          "data-invalid": props.invalid ? "" : undefined,
          "data-success": !props.invalid && props.success ? "" : undefined,
        },
        [
          props.name ? h("input", { type: "hidden", name: props.name, value: value.value }) : null,
          ...values.value.map((cell, index) =>
            h("input", {
              ...api.value.getInputProps(index),
              key: index,
              class: "pin-input__cell",
              type: props.mask ? "password" : "text",
              value: cell,
              "aria-invalid": props.invalid ? "true" : undefined,
            }),
          ),
        ],
      );
  },
});
