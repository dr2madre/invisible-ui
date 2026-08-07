import { defineComponent, h, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import {
  useTimeField,
  type HourCycle,
  type TimeSegmentType,
  type TimeValueError,
} from "./use-time-field";

export interface TimeFieldProps {
  /** Value as `"HH:mm"` or `"HH:mm:ss"` (24h); bindable with `v-model`. */
  modelValue?: string | null;
  value?: string | null;
  hourCycle?: HourCycle;
  withSeconds?: boolean;
  disabled?: boolean;
  /** Domain-level invalid state. Structural time errors are detected automatically. */
  invalid?: boolean;
  /** Visible, actionable error text supplied by the application. */
  error?: string;
  /** Accessible name for the whole field. Defaults to the catalog's "Time". */
  label?: string;
  /** Form field name; the formatted time is submitted under it. */
  name?: string;
  onValueChange?: (value: string | null) => void;
  /** Called when structural validation changes; `null` means no structural error. */
  onValidationChange?: (error: TimeValueError | null) => void;
}

/**
 * TimeField: the styled segmented time input (hour : minute [: second]
 * [AM/PM]). Each segment is a `role="spinbutton"` driven by the headless time
 * field (`@design-system/core`): ArrowUp/Down increment and decrement with
 * wrapping, Left/Right move between segments, digits type with auto-advance,
 * Backspace clears, and A/P set the period in 12-hour mode. The value is the
 * canonical 24-hour string (`HH:mm` or `HH:mm:ss`) and binds two ways:
 * `v-model` or the `value` prop plus `onValueChange`. Themeable via
 * `--ds-time-field-*`.
 */
export const TimeField = defineComponent({
  name: "TimeField",
  props: {
    modelValue: { type: String as PropType<string | null>, default: undefined },
    value: { type: String as PropType<string | null>, default: null },
    hourCycle: { type: Number as PropType<HourCycle>, default: 24 },
    withSeconds: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    invalid: { type: Boolean, default: false },
    error: { type: String, default: undefined },
    label: { type: String, default: undefined },
    name: { type: String, default: undefined },
    onValueChange: {
      type: Function as PropType<(value: string | null) => void>,
      default: undefined,
    },
    onValidationChange: {
      type: Function as PropType<(error: TimeValueError | null) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:modelValue": (value: string | null) => value === null || typeof value === "string",
  },
  setup(props, { emit }) {
    const i18n = useI18n();

    const { api, segments, parts, id } = useTimeField(() => ({
      value: props.modelValue !== undefined ? props.modelValue : props.value,
      hourCycle: props.hourCycle,
      withSeconds: props.withSeconds,
      disabled: props.disabled,
      invalid: props.invalid || Boolean(props.error),
      messages: {
        hour: i18n.value.t("timeField.hour"),
        minute: i18n.value.t("timeField.minute"),
        second: i18n.value.t("timeField.second"),
        dayPeriod: i18n.value.t("timeField.dayPeriod"),
        empty: i18n.value.t("timeField.empty"),
      },
      onValueChange: (next: string | null) => {
        emit("update:modelValue", next);
        props.onValueChange?.(next);
      },
      onValidationChange: props.onValidationChange,
    }));

    const errorId = `${id}-error`;
    const validationMessage = (error: TimeValueError | null): string | undefined => {
      switch (error) {
        case "invalid-format":
          return i18n.value.t("timeField.invalidFormat");
        case "out-of-range":
          return i18n.value.t("timeField.outOfRange");
        case "seconds-required":
          return i18n.value.t("timeField.secondsRequired");
        case "seconds-not-allowed":
          return i18n.value.t("timeField.secondsNotAllowed");
        default:
          return undefined;
      }
    };

    // A segment reads as a placeholder while its corresponding part is empty.
    const isEmpty = (seg: TimeSegmentType, text: string) =>
      text === "hh" ||
      text === "mm" ||
      text === "ss" ||
      (seg === "dayPeriod" && parts.value.dayPeriod == null);

    return () => {
      const message = props.error ?? validationMessage(api.value.validationError);
      return h("div", { class: "time-field-control" }, [
        h(
          "div",
          {
            ...api.value.rootProps,
            class: [
              "time-field",
              {
                "time-field--disabled": props.disabled,
                "time-field--invalid": props.invalid || Boolean(message),
              },
            ],
            "aria-label": props.label ?? i18n.value.t("timeField.label"),
            "aria-disabled": props.disabled || undefined,
            "aria-describedby": message ? errorId : undefined,
            "aria-invalid": props.invalid || Boolean(message) || undefined,
          },
          [
            props.name
              ? h("input", { type: "hidden", name: props.name, value: api.value.value ?? "" })
              : null,
            ...segments.value.flatMap((seg, index) => {
              const text = api.value.getSegmentText(seg);
              return [
                index > 0
                  ? h(
                      "span",
                      {
                        key: `${seg}-separator`,
                        class: "time-field__separator",
                        "aria-hidden": "true",
                      },
                      seg === "dayPeriod" ? " " : ":",
                    )
                  : null,
                h(
                  "span",
                  {
                    key: seg,
                    ...api.value.getSegmentProps(seg),
                    class: [
                      "time-field__segment",
                      {
                        "time-field__segment--placeholder": isEmpty(seg, text),
                        "time-field__segment--period": seg === "dayPeriod",
                      },
                    ],
                    tabindex: props.disabled ? -1 : 0,
                  },
                  text,
                ),
              ];
            }),
          ],
        ),
        message
          ? h("p", { id: errorId, class: "time-field__error", "aria-live": "polite" }, message)
          : null,
      ]);
    };
  },
});
