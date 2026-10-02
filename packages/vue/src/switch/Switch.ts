import { defineComponent, h, ref, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { useSwitch } from "./use-switch";
import { useLiveDom, useResettableValue } from "../internal/form-reset";

export interface SwitchProps {
  /** Accessible, visible label (required). Override with the default slot for rich content. */
  label: string;
  /**
   * Visually hide the label while keeping it as the accessible name. The label
   * text is always required.
   */
  hideLabel?: boolean;
  /** `v-model` value; takes precedence over `checked` when bound. */
  modelValue?: boolean;
  checked?: boolean;
  disabled?: boolean;
  /** Form field name; the value is submitted under it when on. */
  name?: string;
  /** Value submitted with the form when on. Defaults to the native `"on"`. */
  value?: string;
  /** Mark the control required for native form validation. */
  required?: boolean;
  /** Show ON/OFF text inside the track (a wider, labelled variant). */
  onOff?: boolean;
  /** Track text when on / off (only with `onOff`). Defaults to the catalog's "ON" / "OFF". */
  onText?: string;
  offText?: string;
  /** Called whenever the on/off value changes. */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Switch: the styled switch built on a native
 * `<input type="checkbox" role="switch">`. The browser provides Space
 * activation, focus and form participation; `role="switch"` makes screen
 * readers announce on/off, which is clearer than a checkbox for settings.
 *
 * The checked value binds two ways: `v-model` (the idiomatic Vue form) or the
 * `checked` prop plus `onCheckedChange`, matching the React adapter.
 *
 * Prefer this over a checkbox for instant on/off settings. Themeable via
 * `--ds-switch-*`.
 */
export const Switch = defineComponent({
  name: "Switch",
  props: {
    label: { type: String, required: true },
    hideLabel: { type: Boolean, default: false },
    modelValue: { type: Boolean, default: undefined },
    checked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: undefined },
    value: { type: String, default: "on" },
    required: { type: Boolean, default: false },
    onOff: { type: Boolean, default: false },
    onText: { type: String, default: undefined },
    offText: { type: String, default: undefined },
    onCheckedChange: {
      type: Function as PropType<(checked: boolean) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:modelValue": (checked: boolean) => typeof checked === "boolean",
  },
  setup(props, { emit, slots }) {
    const input = ref<HTMLInputElement | null>(null);
    const given = () => props.modelValue ?? props.checked;
    const { told, fallback } = useResettableValue(
      given,
      () => input.value,
      (value) => emit("update:modelValue", value),
    );

    const api = useSwitch(() => ({
      checked: told.value,
      disabled: props.disabled,
      onCheckedChange: (next: boolean) => {
        told.value = next;
        emit("update:modelValue", next);
        props.onCheckedChange?.(next);
      },
    }));
    const i18n = useI18n();

    // The attribute carries the default, so a native reset and a no-script
    // render both have one; the property carries what the user sees.
    useLiveDom(input, () => ({ checked: api.value.checked }));

    return () => {
      const { t } = i18n.value;

      return h("label", { class: props.disabled ? "field field--disabled" : "field" }, [
        h("input", {
          ...api.value.rootProps,
          ref: input,
          class: "switch__input",
          name: props.name,
          value: props.value,
          required: props.required,
          "^checked": fallback.value ? "" : undefined,
        }),
        h(
          "span",
          { class: props.onOff ? "switch switch--onoff" : "switch", "aria-hidden": "true" },
          props.onOff
            ? [
                h("span", { class: "switch__on" }, props.onText ?? t("switch.on")),
                h("span", { class: "switch__off" }, props.offText ?? t("switch.off")),
              ]
            : undefined,
        ),
        h(
          "span",
          { class: ["field__label", { "field__label--hidden": props.hideLabel }] },
          slots.default ? slots.default() : props.label,
        ),
      ]);
    };
  },
});
