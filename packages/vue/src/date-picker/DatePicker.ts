import { i18n as coreI18n } from "@design-system/core";
import { computed, defineComponent, h, ref, Teleport, watch, type PropType } from "vue";
import { Calendar, type CalendarEvent } from "../calendar/Calendar";
import type { WeekStart } from "../calendar/use-calendar";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { usePopover } from "../popover/use-popover";

/** Intl date style used for the field display. */
export type DateStyle = "full" | "long" | "medium" | "short";

export interface DatePickerProps {
  /** Selected date (ISO `YYYY-MM-DD`); bindable with `v-model`. */
  modelValue?: string | null;
  value?: string | null;
  min?: string;
  max?: string;
  weekStartsOn?: WeekStart;
  locale?: string;
  dateStyle?: DateStyle;
  /** Accessible label for the field. Defaults to the catalog's "Date". */
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Show a clear button once a date is selected. */
  clearable?: boolean;
  /** Forwarded to the calendar. */
  events?: CalendarEvent[];
  prices?: Record<string, string>;
  /** Form field name; the selected ISO date is submitted under it. */
  name?: string;
  onValueChange?: (value: string | null) => void;
}

/**
 * DatePicker: a date field that opens a `Calendar` in a popover. It composes
 * the headless popover (`@design-system/core`, via `usePopover`) with the
 * styled `Calendar`: the readonly field is the trigger, focus moves into the
 * calendar, picking a day fills the field and closes the popover, and Escape
 * returns focus to the field.
 *
 * The field shows the selected date formatted with `Intl` (`dateStyle`); the
 * value is the ISO `YYYY-MM-DD` string and binds two ways: `v-model` or the
 * `value` prop plus `onValueChange`. `min`/`max`, `events` (appointment dots)
 * and `prices` are forwarded to the calendar. Themeable via
 * `--ds-date-picker-*` and the calendar's `--ds-calendar-*`.
 */
export const DatePicker = defineComponent({
  name: "DatePicker",
  props: {
    modelValue: { type: String as PropType<string | null>, default: undefined },
    value: { type: String as PropType<string | null>, default: null },
    min: { type: String, default: undefined },
    max: { type: String, default: undefined },
    weekStartsOn: { type: Number as PropType<WeekStart>, default: 1 },
    locale: { type: String, default: undefined },
    dateStyle: { type: String as PropType<DateStyle>, default: "medium" },
    label: { type: String, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    events: { type: Array as PropType<CalendarEvent[]>, default: () => [] },
    prices: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
    name: { type: String, default: undefined },
    onValueChange: {
      type: Function as PropType<(value: string | null) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:modelValue": (value: string | null) => value === null || typeof value === "string",
  },
  setup(props, { emit }) {
    const teleportDisabled = useHydratedTeleport();
    const i18n = useI18n();
    const { api, open, setOpen, triggerRef, panelRef } = usePopover(() => ({
      placement: "bottom-start",
    }));

    // An empty string means "nothing selected", the state a text-shaped
    // model starts in; it reaches the date formatters as an invalid date.
    const bound = computed(() => {
      const raw = props.modelValue !== undefined ? props.modelValue : props.value;
      return raw ? raw : null;
    });
    const selected = ref<string | null>(bound.value);

    // Mirror an externally controlled value, as the other composables do.
    watch(bound, (next) => {
      selected.value = next;
    });

    const dt = (iso: string) => new Date(`${iso}T00:00:00`);
    const displayFmt = computed(() =>
      coreI18n.dateTimeFormat(props.locale ?? i18n.value.locale, { dateStyle: props.dateStyle }),
    );
    const displayValue = computed(() =>
      selected.value ? displayFmt.value.format(dt(selected.value)) : "",
    );

    const report = (next: string | null) => {
      selected.value = next;
      emit("update:modelValue", next);
      props.onValueChange?.(next);
    };

    const fieldLabel = () => props.label ?? i18n.value.t("datePicker.label");

    return () =>
      h("div", { class: ["date-picker", { "date-picker--disabled": props.disabled }] }, [
        props.name
          ? h("input", { type: "hidden", name: props.name, value: selected.value ?? "" })
          : null,
        h("div", { class: "date-picker__field" }, [
          h(
            "span",
            {
              class: [
                "date-picker__icon",
                { "date-picker__icon--active": Boolean(selected.value) },
              ],
              "aria-hidden": "true",
            },
            [
              h(
                Icon,
                { size: "1.1rem" },
                {
                  default: () => [
                    h("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }),
                    h("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
                    h("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
                    h("line", { x1: "3", y1: "10", x2: "21", y2: "10" }),
                  ],
                },
              ),
            ],
          ),
          h("input", {
            ...api.value.triggerProps,
            ref: triggerRef,
            class: "date-picker__input",
            type: "text",
            role: "combobox",
            readonly: true,
            disabled: props.disabled,
            "aria-label": fieldLabel(),
            placeholder: props.placeholder ?? i18n.value.t("datePicker.placeholder"),
            value: displayValue.value,
          }),
          props.clearable && selected.value && !props.disabled
            ? h(
                "button",
                {
                  class: "date-picker__clear",
                  type: "button",
                  "aria-label": i18n.value.t("datePicker.clear"),
                  onClick: () => report(null),
                },
                [
                  h(
                    Icon,
                    { size: "0.9rem" },
                    {
                      default: () => [
                        h("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                        h("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
                      ],
                    },
                  ),
                ],
              )
            : null,
        ]),

        open.value
          ? h(Teleport, { to: "body", disabled: teleportDisabled.value }, [
              h(
                "div",
                { ...api.value.contentProps, ref: panelRef, class: "date-picker__popover" },
                [
                  h(Calendar, {
                    value: selected.value,
                    focusedDate: selected.value ?? undefined,
                    min: props.min,
                    max: props.max,
                    weekStartsOn: props.weekStartsOn,
                    locale: props.locale,
                    events: props.events,
                    prices: props.prices,
                    label: fieldLabel(),
                    onValueChange: (iso: string) => {
                      report(iso);
                      setOpen(false);
                    },
                  }),
                ],
              ),
            ])
          : null,
      ]);
  },
});
