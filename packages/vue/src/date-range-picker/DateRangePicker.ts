import { i18n as coreI18n } from "@design-system/core";
import { computed, defineComponent, h, ref, watch, type PropType } from "vue";
import { Calendar, type CalendarEvent } from "../calendar/Calendar";
import type { CalendarView, WeekStart } from "../calendar/use-calendar";
import type { DateStyle } from "../date-picker/DatePicker";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { useHydratedTeleport } from "../internal/use-hydrated-teleport";
import { scopedTeleport } from "../internal/locale-teleport";
import { usePopover } from "../popover/use-popover";

export interface DateRangePickerProps {
  /** Range start (ISO `YYYY-MM-DD`), or `null`. */
  start?: string | null;
  /** Range end (ISO `YYYY-MM-DD`), or `null`. */
  end?: string | null;
  min?: string;
  max?: string;
  weekStartsOn?: WeekStart;
  locale?: string;
  dateStyle?: DateStyle;
  /** Calendar view inside the popover. Defaults to two months side by side. */
  view?: CalendarView;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  events?: CalendarEvent[];
  prices?: Record<string, string>;
  /** Form field name for the start date, submitted as an ISO value. */
  startName?: string;
  /** Form field name for the end date, submitted as an ISO value. */
  endName?: string;
  onChange?: (start: string | null, end: string | null) => void;
}

/**
 * DateRangePicker: a field that opens a range `Calendar` in a popover. It
 * composes the headless popover (`usePopover`) with `Calendar` in
 * `mode="range"`: the first click sets the start, the next sets the end (days
 * between are banded), and the popover closes once both are chosen. The field
 * shows the range formatted with `Intl`; the value is two ISO `YYYY-MM-DD`
 * strings, bindable with `v-model:start` and `v-model:end`.
 *
 * `min`/`max`, `events` and `prices` forward to the calendar; the view
 * defaults to two months, which suits ranges. Themeable via
 * `--ds-date-picker-*` and the calendar's `--ds-calendar-*`.
 */
export const DateRangePicker = defineComponent({
  name: "DateRangePicker",
  props: {
    start: { type: String as PropType<string | null>, default: null },
    end: { type: String as PropType<string | null>, default: null },
    min: { type: String, default: undefined },
    max: { type: String, default: undefined },
    weekStartsOn: { type: Number as PropType<WeekStart>, default: 1 },
    locale: { type: String, default: undefined },
    dateStyle: { type: String as PropType<DateStyle>, default: "medium" },
    view: { type: String as PropType<CalendarView>, default: "two-month" },
    label: { type: String, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    events: { type: Array as PropType<CalendarEvent[]>, default: () => [] },
    prices: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
    startName: { type: String, default: undefined },
    endName: { type: String, default: undefined },
    onChange: {
      type: Function as PropType<(start: string | null, end: string | null) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:start": (value: string | null) => value === null || typeof value === "string",
    "update:end": (value: string | null) => value === null || typeof value === "string",
  },
  setup(props, { emit }) {
    const teleportDisabled = useHydratedTeleport();
    const i18n = useI18n();
    const { api, open, setOpen, triggerRef, panelRef } = usePopover(() => ({
      placement: "bottom-start",
    }));

    // An empty string means "nothing selected", the state a text-shaped
    // model starts in; it reaches the date formatters as an invalid date.
    const asDate = (iso: string | null | undefined) => (iso ? iso : null);
    const start = ref<string | null>(asDate(props.start));
    const end = ref<string | null>(asDate(props.end));

    // Mirror the externally controlled endpoints.
    watch(
      () => props.start,
      (next) => {
        start.value = asDate(next);
      },
    );
    watch(
      () => props.end,
      (next) => {
        end.value = asDate(next);
      },
    );

    const dt = (iso: string) => new Date(`${iso}T00:00:00`);
    const displayFmt = computed(() =>
      coreI18n.dateTimeFormat(props.locale ?? i18n.value.locale, { dateStyle: props.dateStyle }),
    );
    const displayValue = computed(() => {
      if (start.value && end.value)
        return displayFmt.value.formatRange(dt(start.value), dt(end.value));
      if (start.value) return `${displayFmt.value.format(dt(start.value))} – …`;
      return "";
    });

    const report = (nextStart: string | null, nextEnd: string | null) => {
      start.value = nextStart;
      end.value = nextEnd;
      emit("update:start", nextStart);
      emit("update:end", nextEnd);
      props.onChange?.(nextStart, nextEnd);
    };

    const fieldLabel = () => props.label ?? i18n.value.t("dateRangePicker.label");

    return () =>
      h("div", { class: ["date-picker", { "date-picker--disabled": props.disabled }] }, [
        props.startName
          ? h("input", { type: "hidden", name: props.startName, value: start.value ?? "" })
          : null,
        props.endName
          ? h("input", { type: "hidden", name: props.endName, value: end.value ?? "" })
          : null,
        h("div", { class: "date-picker__field" }, [
          h(
            "span",
            {
              class: [
                "date-picker__icon",
                { "date-picker__icon--active": Boolean(start.value || end.value) },
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
            class: "date-picker__input date-picker__input--range",
            type: "text",
            role: "combobox",
            readonly: true,
            disabled: props.disabled,
            "aria-label": fieldLabel(),
            placeholder: props.placeholder ?? i18n.value.t("dateRangePicker.placeholder"),
            value: displayValue.value,
          }),
          props.clearable && start.value && !props.disabled
            ? h(
                "button",
                {
                  class: "date-picker__clear",
                  type: "button",
                  "aria-label": i18n.value.t("dateRangePicker.clear"),
                  onClick: () => report(null, null),
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
          ? scopedTeleport(teleportDisabled.value, i18n.value, [
              h(
                "div",
                {
                  ...api.value.contentProps,
                  ref: panelRef,
                  class: "date-picker__popover date-picker__popover--wide",
                },
                [
                  h(Calendar, {
                    mode: "range",
                    rangeStart: start.value,
                    rangeEnd: end.value,
                    focusedDate: start.value ?? undefined,
                    view: props.view,
                    min: props.min,
                    max: props.max,
                    weekStartsOn: props.weekStartsOn,
                    locale: props.locale,
                    events: props.events,
                    prices: props.prices,
                    label: fieldLabel(),
                    onRangeChange: (nextStart: string | null, nextEnd: string | null) => {
                      report(nextStart, nextEnd);
                      if (nextStart && nextEnd) setOpen(false);
                    },
                  }),
                ],
              ),
            ])
          : null,
      ]);
  },
});
