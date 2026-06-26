import { timeField as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { normalizeProps } from "../normalize";

export type HourCycle = core.HourCycle;
export type TimeSegmentType = core.TimeSegmentType;
export type TimeParts = core.TimeParts;
export type TimeFieldApi = core.TimeFieldApi;
export type TimeFieldState = core.TimeFieldState;
export type TimeFieldContext = core.TimeFieldContext;

export interface CreateTimeField {
  state: Readable<TimeFieldState>;
  api: Readable<TimeFieldApi>;
  /** Svelte action for the field container. */
  rootAction: Action<HTMLElement>;
  /** Svelte action for a segment, by type: `<span use:segmentAction={"hour"}>`. */
  segmentAction: Action<HTMLElement, TimeSegmentType>;
}

/**
 * Create a headless time field (segmented spinbutton). Behaviour and the
 * digit-entry/keyboard logic live in `@design-system/core`; this adapter wires
 * state to a Svelte store, applies connected props via actions, moves DOM focus
 * between segments, and emits `onValueChange` when the formatted value changes.
 */
export function createTimeField(context: TimeFieldContext): CreateTimeField {
  const state = writable<TimeFieldState>(core.initialState(context));
  const baseId = get(state).id;

  let lastValue = core.connect({
    state: get(state),
    commit: () => {},
    normalize: normalizeProps,
  }).value;

  const commit = (parts: TimeParts, buffer: string, bufferSeg: TimeSegmentType | null) => {
    state.update((s) => ({ ...s, parts, buffer, bufferSeg }));
    const next = core.format(parts, get(state).withSeconds);
    if (next !== lastValue) {
      lastValue = next;
      context.onValueChange?.(next);
    }
  };

  const focus = (seg: TimeSegmentType) => {
    document.getElementById(core.segmentId(baseId, seg))?.focus();
  };

  const api = derived(state, ($state) =>
    core.connect({ state: $state, commit, focus, normalize: normalizeProps }),
  );

  const rootAction = createPropsAction(api, (a) => a.rootProps);
  const segmentAction: Action<HTMLElement, TimeSegmentType> = (node, seg) => {
    const segApi = derived(api, (a) => a.getSegmentProps(seg as TimeSegmentType));
    const handle = createPropsAction(segApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  return { state, api, rootAction, segmentAction };
}
