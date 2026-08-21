import { timeField as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type HourCycle = core.HourCycle;
export type TimeSegmentType = core.TimeSegmentType;
export type TimeParts = core.TimeParts;
export type TimeInputStatus = core.TimeInputStatus;
export type TimeValueError = core.TimeValueError;

export interface UseTimeFieldOptions {
  /** Initial / controlled value, `"HH:mm"` or `"HH:mm:ss"` (24h), or `null`. */
  value?: string | null;
  /** 12- or 24-hour cycle (adds an AM/PM segment when 12). Defaults to 24. */
  hourCycle?: HourCycle;
  /** Include a seconds segment. Defaults to false. */
  withSeconds?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  messages?: Partial<core.TimeFieldMessages>;
  /** Called with the formatted value, or `null` while a segment is empty. */
  onValueChange?: (value: string | null) => void;
  /** Called when the user finishes editing: focus leaves the field, or Enter. */
  onValueCommit?: (value: string | null) => void;
  onValidationChange?: (error: TimeValueError | null) => void;
  /** Earliest acceptable time (`"HH:mm[:ss]"`), inclusive. */
  min?: string;
  /** Latest acceptable time (`"HH:mm[:ss]"`), inclusive. */
  max?: string;
}

export interface UseTimeField {
  /** Reactive connected API; spread `rootProps` / `getSegmentProps`. */
  api: ComputedRef<core.TimeFieldApi>;
  /** Bind to the field container's `focusout`: reports the end of editing. */
  onFieldFocusOut: (event: FocusEvent) => void;
  /** The ordered segments for the current configuration. */
  segments: ComputedRef<TimeSegmentType[]>;
  /** The resolved parts, for placeholder rendering. */
  parts: ComputedRef<TimeParts>;
  /** Stable base id used to associate help and error text. */
  id: string;
}

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * Connect the headless time field (a segmented spinbutton) to Vue. The
 * digit-entry and keyboard logic live in `@design-system/core`: arrows
 * increment and decrement with wrapping, Left/Right move between segments,
 * digits type with auto-advance, Backspace clears, and A/P set the period in
 * 12-hour mode. This composable owns the resolved parts, moves DOM focus
 * between segments, and reports the formatted value when it changes.
 */
export function useTimeField(options: MaybeRefOrGetter<UseTimeFieldOptions> = {}): UseTimeField {
  const id = useStableId("ds-time-field");
  const resolved = computed(() => toValue(options));

  const hourCycle = computed(() => resolved.value.hourCycle ?? 24);
  const withSeconds = computed(() => resolved.value.withSeconds ?? false);

  const initial = core.parseTimeValue(resolved.value.value, {
    hourCycle: hourCycle.value,
    withSeconds: withSeconds.value,
  });
  const parts = ref<TimeParts>(initial.parts);
  const committedParts = ref<TimeParts>(initial.parts);
  const validationError = ref<TimeValueError | null>(initial.error);
  const invalidSegment = ref<Exclude<TimeSegmentType, "dayPeriod"> | null>(initial.invalidSegment);
  const buffer = ref("");
  const bufferSeg = ref<TimeSegmentType | null>(null);

  // The last value reported, so a commit that leaves the formatted value
  // unchanged (e.g. typing the first of two digits) stays quiet.
  let lastValue = core.format(parts.value, withSeconds.value, hourCycle.value);

  watch(validationError, (error) => resolved.value.onValidationChange?.(error), {
    immediate: true,
  });

  // Mirror an externally controlled value.
  watch(
    [() => resolved.value.value, hourCycle, withSeconds],
    ([next, nextHourCycle, nextWithSeconds]) => {
      const parsed = core.parseTimeValue(next, {
        hourCycle: nextHourCycle,
        withSeconds: nextWithSeconds,
      });
      parts.value = parsed.parts;
      validationError.value = parsed.error;
      invalidSegment.value = parsed.invalidSegment;
      buffer.value = "";
      bufferSeg.value = null;
      lastValue = core.format(parts.value, nextWithSeconds, nextHourCycle);
    },
  );

  // The bounds are only accepted when they are real times, as in core.
  const bounds = computed(() => {
    const valid = (value: string | undefined) =>
      value && core.parseTimeValue(value).status === "valid" ? value : null;
    return { min: valid(resolved.value.min), max: valid(resolved.value.max) };
  });

  const setParts = (
    nextParts: TimeParts,
    nextBuffer: string,
    nextBufferSeg: TimeSegmentType | null,
  ) => {
    parts.value = nextParts;
    validationError.value = null;
    invalidSegment.value = null;
    buffer.value = nextBuffer;
    bufferSeg.value = nextBufferSeg;
    const next = core.format(nextParts, withSeconds.value, hourCycle.value);
    if (next === lastValue) return;
    lastValue = next;
    resolved.value.onValueChange?.(next);
  };

  // Segments are always rendered, so the target element is already in the DOM.
  const focus = (seg: TimeSegmentType) => {
    document.getElementById(core.segmentId(id, seg))?.focus();
  };

  const api = computed(() =>
    core.connect({
      state: {
        parts: parts.value,
        committedParts: committedParts.value,
        hourCycle: hourCycle.value,
        withSeconds: withSeconds.value,
        min: bounds.value.min,
        max: bounds.value.max,
        validationError: validationError.value,
        invalidSegment: invalidSegment.value,
        buffer: buffer.value,
        bufferSeg: bufferSeg.value,
        id,
      },
      setParts,
      setCommittedParts: (next) => (committedParts.value = next),
      onCommit: (value) => resolved.value.onValueCommit?.(value),
      focus,
      invalid: resolved.value.invalid,
      disabled: resolved.value.disabled,
      describedBy: resolved.value.describedBy,
      messages: resolved.value.messages,
      normalize: normalizeProps,
    }),
  );

  /**
   * Focus moving between segments is ordinary editing; focus leaving the field
   * altogether is the user finishing. Only the DOM can tell the difference.
   */
  const onFieldFocusOut = (event: FocusEvent) => {
    const container = event.currentTarget;
    const next = event.relatedTarget;
    if (container instanceof Node && next instanceof Node && container.contains(next)) return;
    api.value.commit();
  };

  return {
    api,
    segments: computed(() => core.segments(hourCycle.value, withSeconds.value)),
    parts: computed(() => parts.value),
    onFieldFocusOut,
    id,
  };
}
