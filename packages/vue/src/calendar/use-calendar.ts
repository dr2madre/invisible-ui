import { calendar as core } from "@design-system/core";
import {
  computed,
  nextTick,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
} from "vue";
import { normalizeProps } from "../normalize";

export type CalendarView = core.CalendarView;
export type WeekStart = core.WeekStart;
export type CalendarDay = core.CalendarDay;

export interface UseCalendarOptions {
  /** Selected date (ISO `YYYY-MM-DD`), or `null`. */
  value?: string | null;
  /** The date driving what is shown and where focus sits. */
  focusedDate?: string;
  /** Layout/period. Defaults to `"month"`. */
  view?: CalendarView;
  /** First day of the week. Defaults to `1` (Monday). */
  weekStartsOn?: WeekStart;
  /** Earliest selectable date (ISO), inclusive. */
  min?: string;
  /** Latest selectable date (ISO), inclusive. */
  max?: string;
  onValueChange?: (value: string) => void;
  onFocusChange?: (focusedDate: string) => void;
  onViewChange?: (view: CalendarView) => void;
}

export interface UseCalendar {
  /** Reactive connected API; spread `gridProps` / `rowProps` / `getCellProps` / `getDayProps`. */
  api: ComputedRef<core.CalendarApi>;
  /** The selected date, or `null`. */
  value: ComputedRef<string | null>;
  /** The date focus and the visible period follow. */
  focusedDate: ComputedRef<string>;
  view: ComputedRef<CalendarView>;
  weekStartsOn: ComputedRef<WeekStart>;
}

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
let instanceCount = 0;

/**
 * Connect the headless calendar (WAI-ARIA date-grid pattern) to Vue: a roving
 * tab stop on the focused day, arrow / Home / End / PageUp / PageDown
 * navigation, selection bounded by `[min, max]`, and prev/next/today stepping
 * per view. Behaviour and all date arithmetic live in `@design-system/core`;
 * this composable owns the resolved state, derives the connected props with
 * `computed(connect)`, and moves DOM focus to the day the core asks for.
 *
 * Focus is deferred to the next tick: a day in a month that is only rendered
 * by the pending update cannot receive focus before Vue patches the grid.
 */
export function useCalendar(options: MaybeRefOrGetter<UseCalendarOptions> = {}): UseCalendar {
  const id = `ds-calendar-${++instanceCount}`;
  const resolved = computed(() => toValue(options));

  // An empty string means "nothing selected": a consumer binding a
  // text-shaped model starts there, and `""` reaches the date formatters as
  // an invalid date. It resolves to null, and the focus falls through.
  const asDate = (iso: string | null | undefined) => (iso ? iso : null);

  const value = ref<string | null>(asDate(resolved.value.value));
  const focusedDate = ref<string>(
    asDate(resolved.value.focusedDate) ?? asDate(resolved.value.value) ?? core.today(),
  );
  const view = ref<CalendarView>(resolved.value.view ?? "month");

  // Mirror the externally controlled pieces.
  watch(
    () => resolved.value.value,
    (next) => {
      value.value = asDate(next);
    },
  );
  watch(
    () => resolved.value.focusedDate,
    (next) => {
      if (next) focusedDate.value = next;
    },
  );
  watch(
    () => resolved.value.view,
    (next) => {
      if (next) view.value = next;
    },
  );

  const setValue = (iso: string) => {
    if (value.value === iso) return;
    value.value = iso;
    resolved.value.onValueChange?.(iso);
  };

  const setFocus = (iso: string) => {
    if (focusedDate.value === iso) return;
    focusedDate.value = iso;
    resolved.value.onFocusChange?.(iso);
  };

  const setView = (next: CalendarView) => {
    if (view.value === next) return;
    view.value = next;
    resolved.value.onViewChange?.(next);
  };

  const focus = (iso: string) => {
    void nextTick().then(() => document.getElementById(core.dayId(id, iso))?.focus());
  };

  const api = computed(() =>
    core.connect({
      state: {
        value: value.value,
        focusedDate: focusedDate.value,
        view: view.value,
        weekStartsOn: resolved.value.weekStartsOn ?? 1,
        min: resolved.value.min ?? null,
        max: resolved.value.max ?? null,
        monthCount: 2,
        id,
      },
      setValue,
      setFocus,
      setView,
      focus,
      normalize: normalizeProps,
    }),
  );

  return {
    api,
    value: computed(() => value.value),
    focusedDate: computed(() => focusedDate.value),
    view: computed(() => view.value),
    weekStartsOn: computed(() => resolved.value.weekStartsOn ?? 1),
  };
}
