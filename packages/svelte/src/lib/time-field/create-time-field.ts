import { timeField as core } from "@design-system/core";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type HourCycle = core.HourCycle;
export type TimeSegmentType = core.TimeSegmentType;
export type TimeParts = core.TimeParts;
export type TimeFieldApi = core.TimeFieldApi;
export type TimeFieldState = core.TimeFieldState;
export type TimeFieldContext = core.TimeFieldContext;
export type TimeValueError = core.TimeValueError;

export interface CreateTimeFieldOptions extends TimeFieldContext {
  onValueCommit?: (value: string | null) => void;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  messages?: Partial<core.TimeFieldMessages>;
  onValidationChange?: (error: TimeValueError | null) => void;
}

export interface CreateTimeField {
  state: Readable<TimeFieldState>;
  api: Readable<TimeFieldApi>;
  /** Action for the field container: reports when focus leaves the whole field. */
  fieldAction: Action<HTMLElement>;
  /** Mirror bounds and shape after mount (no callbacks: they are data). */
  syncConfig: (config: {
    min?: string;
    max?: string;
    hourCycle?: core.HourCycle;
    withSeconds?: boolean;
  }) => void;
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
export function createTimeField(context: CreateTimeFieldOptions): CreateTimeField {
  const state = writable<TimeFieldState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-time-field") }),
  );
  const baseId = get(state).id;
  context.onValidationChange?.(get(state).validationError);

  let lastValue = core.connect({
    state: get(state),
    setParts: () => {},
    setCommittedParts: () => {},
    normalize: normalizeProps,
  }).value;

  const setParts = (parts: TimeParts, buffer: string, bufferSeg: TimeSegmentType | null) => {
    const previousError = get(state).validationError;
    state.update((s) => ({
      ...s,
      parts,
      buffer,
      bufferSeg,
      validationError: null,
      invalidSegment: null,
    }));
    if (previousError) context.onValidationChange?.(null);
    const current = get(state);
    const next = core.format(parts, current.withSeconds, current.hourCycle);
    if (next !== lastValue) {
      lastValue = next;
      context.onValueChange?.(next);
    }
  };

  const setCommittedParts = (committedParts: TimeParts) =>
    state.update((s) => (s.committedParts === committedParts ? s : { ...s, committedParts }));

  const focus = (seg: TimeSegmentType) => {
    document.getElementById(core.segmentId(baseId, seg))?.focus();
  };

  /** Mirror the configuration after mount: bounds and shape are data. */
  const syncConfig = (next: {
    min?: string;
    max?: string;
    hourCycle?: core.HourCycle;
    withSeconds?: boolean;
  }) =>
    state.update((s) => {
      const resolved = core.initialState({
        value: core.format(
          s.parts,
          next.withSeconds ?? s.withSeconds,
          next.hourCycle ?? s.hourCycle,
        ),
        min: next.min,
        max: next.max,
        hourCycle: next.hourCycle ?? s.hourCycle,
        withSeconds: next.withSeconds ?? s.withSeconds,
        id: s.id,
      });
      const unchanged =
        resolved.min === s.min &&
        resolved.max === s.max &&
        resolved.hourCycle === s.hourCycle &&
        resolved.withSeconds === s.withSeconds;
      return unchanged
        ? s
        : {
            ...s,
            min: resolved.min,
            max: resolved.max,
            hourCycle: resolved.hourCycle,
            withSeconds: resolved.withSeconds,
          };
    });

  const api = derived(state, ($state) =>
    core.connect({
      state: $state,
      setParts,
      setCommittedParts,
      onCommit: (value) => context.onValueCommit?.(value),
      focus,
      invalid: context.invalid,
      disabled: context.disabled,
      describedBy: context.describedBy,
      messages: context.messages,
      normalize: normalizeProps,
    }),
  );

  const rootAction = createPropsAction(api, (a) => a.rootProps);
  const segmentAction: Action<HTMLElement, TimeSegmentType> = (node, seg) => {
    const segApi = derived(api, (a) => a.getSegmentProps(seg as TimeSegmentType));
    const handle = createPropsAction(segApi, (props) => props)(node);
    return { destroy: () => handle?.destroy?.() };
  };

  /**
   * Focus moving between segments is ordinary editing; focus leaving the field
   * altogether is the user finishing. Only the DOM can tell the difference.
   */
  const fieldAction: Action<HTMLElement> = (node) => {
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && node.contains(next)) return;
      get(api).commit();
    };
    node.addEventListener("focusout", onFocusOut);
    return { destroy: () => node.removeEventListener("focusout", onFocusOut) };
  };

  return { state, api, rootAction, segmentAction, fieldAction, syncConfig };
}
