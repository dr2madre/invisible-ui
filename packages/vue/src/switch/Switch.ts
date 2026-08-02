import { defineComponent, h, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { useSwitch } from "./use-switch";

export interface SwitchProps {
  /** Accessible, visible label (required). Override with the default slot for rich content. */
  label: string;
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
    const api = useSwitch(() => ({
      checked: props.modelValue ?? props.checked,
      disabled: props.disabled,
      onCheckedChange: (next: boolean) => {
        emit("update:modelValue", next);
        props.onCheckedChange?.(next);
      },
    }));
    const i18n = useI18n();

    return () => {
      const { t } = i18n.value;

      return h("label", { class: props.disabled ? "field field--disabled" : "field" }, [
        h("input", {
          ...api.value.rootProps,
          class: "switch__input",
          name: props.name,
          value: props.value,
          required: props.required,
          checked: api.value.checked,
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
        h("span", { class: "field__label" }, slots.default ? slots.default() : props.label),
      ]);
    };
  },
});
