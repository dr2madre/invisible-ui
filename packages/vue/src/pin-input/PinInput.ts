import { defineComponent, h, mergeProps, ref, watch, type PropType } from "vue";
import { usePinInput, type PinInputType } from "./use-pin-input";
import { useFormReset } from "../internal/form-reset";
import { useFieldError } from "../internal/field-error";

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
  /**
   * Error message. When non-empty it shows after the cells as an alert,
   * describes each cell and marks the cells invalid. The application owns it:
   * a form reset leaves it in place, and the application clears it.
   */
  error?: string;
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
  // The message renders beside the group, so the root is a fragment and the
  // attributes go on the group by hand.
  inheritAttrs: false,
  props: {
    modelValue: { type: String, default: undefined },
    value: { type: String, default: "" },
    length: { type: Number, default: 6 },
    type: { type: String as PropType<PinInputType>, default: "numeric" },
    mask: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    invalid: { type: Boolean, default: false },
    success: { type: Boolean, default: false },
    error: { type: String, default: undefined },
    name: { type: String, default: undefined },
    label: { type: String, required: true },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
    onComplete: { type: Function as PropType<(value: string) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (value: string) => typeof value === "string",
  },
  setup(props, { emit, attrs }) {
    const given = () => props.modelValue ?? props.value;
    // The reset default follows the prop, except a give-back of what the
    // control itself reported (ADR 0012).
    const fallback = ref(given());
    const reported = ref<string | undefined>(undefined);

    const { api, values, value, reset, rootRef } = usePinInput(() => ({
      value: given(),
      length: props.length,
      type: props.type,
      mask: props.mask,
      disabled: props.disabled,
      onValueChange: (next: string) => {
        reported.value = next;
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
      onComplete: (next: string) => props.onComplete?.(next),
    }));

    // A give-back is a prop that equals what the control just reported. It
    // cannot be tested against the composable's own value: that is computed
    // from the very prop being judged, so it has already moved.
    watch(given, (next) => {
      if (next !== reported.value) fallback.value = next;
    });

    // The composable's own silent restore: this control passes the prop
    // straight through, so its value watch never fires on a reset.
    useFormReset(
      () => rootRef.value,
      () => {
        reset(fallback.value ?? "");
        // The control's own copy of the value goes back too, which in Vue
        // is the v-model binding. Not the change callback: a reset is not a
        // user change (ADR 0012).
        emit("update:modelValue", fallback.value ?? "");
      },
    );

    const fieldError = useFieldError("ds-pin-input", () => props.error);

    return () => {
      const [errorId, message] = fieldError();
      const invalid = props.invalid || !!errorId;
      return [
        h(
          "div",
          mergeProps(
            {
              ...api.value.rootProps,
              ref: rootRef,
              class: "pin-input",
              "aria-label": props.label,
              "data-invalid": invalid ? "" : undefined,
              "data-success": !invalid && props.success ? "" : undefined,
            },
            attrs,
          ),
          [
            props.name
              ? h("input", {
                  type: "hidden",
                  name: props.name,
                  value: value.value,
                  disabled: props.disabled || undefined,
                })
              : null,
            ...values.value.map((cell, index) =>
              h("input", {
                ...api.value.getInputProps(index),
                key: index,
                class: "pin-input__cell",
                type: props.mask ? "password" : "text",
                value: cell,
                "aria-invalid": invalid ? "true" : undefined,
                "aria-describedby": errorId,
              }),
            ),
          ],
        ),
        message,
      ];
    };
  },
});
