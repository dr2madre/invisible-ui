import { calendar as core } from "@design-system/core";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type CalendarView = core.CalendarView;
export type WeekStart = core.WeekStart;
export type CalendarDay = core.CalendarDay;
export type CalendarApi = core.CalendarApi;
export type CalendarState = core.CalendarState;
export type CalendarContext = core.CalendarContext;

export interface CreateCalendar {
  /** Reactive resolved state. */
  state: Readable<CalendarState>;
  /** Reactive connected API. */
  api: Readable<CalendarApi>;
  setValue: (iso: string) => void;
  setFocus: (iso: string) => void;
  setView: (view: CalendarView) => void;
  /** Svelte action for the grid container: `<div use:gridAction>`. */
  gridAction: Action<HTMLElement>;
  /** Svelte action for a grid row: `<div use:rowAction>`. */
  rowAction: Action<HTMLElement>;
  /** Svelte action for a day cell wrapper: `<div use:cellAction={iso}>`. */
  cellAction: Action<HTMLElement, string>;
  /** Svelte action for the focusable day button: `<button use:dayAction={iso}>`. */
  dayAction: Action<HTMLElement, string>;
}

/**
 * Create a headless calendar (WAI-ARIA date-grid pattern) with roving tabindex
 * and arrow / Home / End / PageUp / PageDown navigation. Behaviour and date
 * math live in `@design-system/core`; this adapter wires state to a Svelte
 * store, applies connected props via actions, and moves DOM focus (deferred to
 * the next render so a day in a freshly-shown month can receive focus).
 */
export function createCalendar(context: CalendarContext): CreateCalendar {
  const state = writable<CalendarState>(core.initialState(context));
  const baseId = get(state).id;

  const setValue = (iso: string) =>
    state.update((s) => {
      if (s.value === iso) return s;
      context.onValueChange?.(iso);
      return { ...s, value: iso };
    });

  const setFocus = (iso: string) =>
    state.update((s) => {
      if (s.focusedDate === iso) return s;
      context.onFocusChange?.(iso);
      return { ...s, focusedDate: iso };
    });

  const setView = (view: CalendarView) =>
    state.update((s) => {
      if (s.view === view) return s;
      context.onViewChange?.(view);
      return { ...s, view };
    });

  const focus = (iso: string) => {
    void tick().then(() => {
      document.getElementById(core.dayId(baseId, iso))?.focus();
    });
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setValue, setFocus, setView, focus, normalize: normalizeProps }),
  );

  const gridAction = createPropsAction(api, (a) => a.gridProps);
  const rowAction = createPropsAction(api, (a) => a.rowProps);
  const cellAction: Action<HTMLElement, string> = (node, iso) => {
    const cellApi = derived(api, (a) => a.getCellProps(iso as string));
    const handle = createPropsAction(cellApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };
  const dayAction: Action<HTMLElement, string> = (node, iso) => {
    const dayApi = derived(api, (a) => a.getDayProps(iso as string));
    const handle = createPropsAction(dayApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return { state, api, setValue, setFocus, setView, gridAction, rowAction, cellAction, dayAction };
}
