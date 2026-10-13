import { defineComponent, h, mergeProps, ref, type PropType } from "vue";
import { useToggleButton } from "./use-toggle-button";
import { useResettableValue } from "../internal/form-reset";
import { useFieldError } from "../internal/field-error";

export interface ToggleButtonProps {
  /**
   * Whether the button is pressed. `v-model` binds it two ways; passing it once
   * and driving clicks through `onPressedChange` works as well.
   */
  modelValue?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  /**
   * Show a leading checkmark when pressed (the filter-chip look). The check
   * reveals the selected state explicitly, the way a checkbox does.
   */
  check?: boolean;
  /** Accessible name; required when the slot content is icon-only. */
  label?: string;
  /** Form field name; while pressed, submits `value` under it. */
  name?: string;
  /** Value submitted under `name` while pressed. */
  value?: string;
  /**
   * Error message. When non-empty it shows after the control as an alert and
   * describes the control. The application owns it: a form reset leaves it in
   * place, and the application clears it.
   */
  error?: string;
  /** Called whenever the pressed value changes. */
  onPressedChange?: (pressed: boolean) => void;
}

/**
 * ToggleButton — the styled, batteries-included toggle button, ported from the
 * Svelte adapter: an independent on/off control (e.g. Bold in a toolbar),
 * rendered as a native `<button type="button">` with `aria-pressed`
 * (WAI-ARIA button pattern). The browser owns the button role, focus, and
 * Enter and Space activation; this layer adds the surface and the on/off
 * styling. The accessible name never changes with the state: only
 * `aria-pressed` does.
 *
 * Use `Switch` for a settings-style on/off control. The label comes from the
 * default slot; provide an explicit `label` when the slot is icon-only so the
 * control still has an accessible name. The pressed value binds two ways:
 * `v-model` or the `pressed` prop plus `onPressedChange`.
 *
 * Form participation is provisional: with `name` set, a hidden input submits
 * `value` while the button is pressed and enabled. The owning form's reset
 * puts the default pressed value back without calling `onPressedChange`.
 *
 * Set `check` for the filter-chip look: a leading checkmark appears when the
 * button is pressed, making the selection explicit alongside the fill. Pairs
 * naturally with `ToggleGroup` for a row of multi-select filter chips.
 *
 * Colors and sizing are themeable via `--ds-toggle-*`.
 */
export const ToggleButton = defineComponent({
  name: "ToggleButton",
  // The message renders beside the button, so the root is a fragment and the
  // attributes go on the button by hand.
  inheritAttrs: false,
  props: {
    modelValue: { type: Boolean, default: undefined },
    pressed: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    check: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    name: { type: String, default: undefined },
    value: { type: String, default: "on" },
    error: { type: String, default: undefined },
    onPressedChange: { type: Function as PropType<(pressed: boolean) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (pressed: boolean) => typeof pressed === "boolean",
  },
  setup(props, { emit, slots, attrs }) {
    const button = ref<HTMLButtonElement | null>(null);
    const given = () => props.modelValue ?? props.pressed;
    // A button keeps no default state of its own, so the reset default is
    // tracked here and the button only names the owning form.
    const { told } = useResettableValue(
      given,
      () => button.value,
      (value) => emit("update:modelValue", value),
    );

    const api = useToggleButton(() => ({
      pressed: told.value,
      disabled: props.disabled,
      onPressedChange: (next: boolean) => {
        told.value = next;
        emit("update:modelValue", next);
        props.onPressedChange?.(next);
      },
    }));

    const fieldError = useFieldError("ds-toggle", () => props.error);

    return () => {
      const hidden = api.value.getHiddenInputProps({ name: props.name, value: props.value });
      const [errorId, message] = fieldError();
      // An app's own description stays, followed by the error.
      const describedBy =
        [attrs["aria-describedby"], errorId].filter(Boolean).join(" ") || undefined;
      const toggle = h(
        "button",
        mergeProps(attrs, {
          ...api.value.rootProps,
          ref: button,
          class: "toggle",
          "aria-label": props.label,
          "aria-describedby": describedBy,
        }),
        [
          h("span", { class: "toggle__surface" }, [
            // Leading checkmark, shown only when pressed: the explicit
            // selected-state mark of a checkbox, in the chip.
            props.check && api.value.pressed
              ? h(
                  "svg",
                  {
                    class: "toggle__check",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    "stroke-width": "2.5",
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "aria-hidden": "true",
                  },
                  [h("path", { d: "M20 6 9 17l-5-5" })],
                )
              : null,
            slots.default?.(),
          ]),
          hidden ? h("input", hidden) : null,
        ],
      );
      return [toggle, message];
    };
  },
});
