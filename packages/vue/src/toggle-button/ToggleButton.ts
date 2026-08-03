import { defineComponent, h, type PropType } from "vue";
import { useToggleButton } from "./use-toggle-button";

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
  /** Form field name; when pressed, submits `value` under it. */
  name?: string;
  /** Value submitted under `name` when pressed. */
  value?: string;
  /** Called whenever the pressed value changes. */
  onPressedChange?: (pressed: boolean) => void;
}

/**
 * ToggleButton — the styled, batteries-included toggle button, ported from the
 * Svelte adapter: an independent on/off control (e.g. Bold in a toolbar), built
 * on a native `<input type="checkbox">` styled to look like a button. The
 * browser owns the checkbox role, Space activation, focus and form
 * participation; this layer adds the button surface and the on/off styling.
 *
 * Use `Switch` for a settings-style on/off control. The label comes from the
 * default slot; provide an explicit `label` when the slot is icon-only so the
 * control still has an accessible name. Pass `name` (and optional `value`) to
 * submit the pressed state with a form. The pressed value binds two ways:
 * `v-model` or the `pressed` prop plus `onPressedChange`.
 *
 * Set `check` for the filter-chip look: a leading checkmark appears when the
 * button is pressed, making the selection explicit alongside the fill. Pairs
 * naturally with `ToggleGroup` for a row of multi-select filter chips.
 *
 * Colors and sizing are themeable via `--ds-toggle-*`.
 */
export const ToggleButton = defineComponent({
  name: "ToggleButton",
  props: {
    modelValue: { type: Boolean, default: undefined },
    pressed: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    check: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    name: { type: String, default: undefined },
    value: { type: String, default: "on" },
    onPressedChange: { type: Function as PropType<(pressed: boolean) => void>, default: undefined },
  },
  emits: {
    "update:modelValue": (pressed: boolean) => typeof pressed === "boolean",
  },
  setup(props, { emit, slots }) {
    const api = useToggleButton(() => ({
      pressed: props.modelValue ?? props.pressed,
      disabled: props.disabled,
      onPressedChange: (next: boolean) => {
        emit("update:modelValue", next);
        props.onPressedChange?.(next);
      },
    }));

    return () =>
      h("label", { class: ["toggle", { "toggle--disabled": props.disabled }] }, [
        h("input", {
          ...api.value.rootProps,
          class: "toggle__input",
          checked: api.value.pressed,
          name: props.name,
          value: props.value,
          "aria-label": props.label,
        }),
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
      ]);
  },
});
