import { timeField as core } from "@design-system/core";
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type HourCycle = core.HourCycle;
export type TimeSegmentType = core.TimeSegmentType;
export type TimeParts = core.TimeParts;

export interface UseTimeFieldOptions {
  /** Initial / controlled value, `"HH:mm"` or `"HH:mm:ss"` (24h), or `null`. */
  value?: string | null;
  /** 12- or 24-hour cycle (adds an AM/PM segment when 12). Defaults to 24. */
  hourCycle?: HourCycle;
  /** Include a seconds segment. Defaults to false. */
  withSeconds?: boolean;
  /** Called with the formatted value, or `null` while a segment is empty. */
  onValueChange?: (value: string | null) => void;
}

export interface UseTimeField {
  /** Reactive connected API; spread `rootProps` / `getSegmentProps`. */
  api: ComputedRef<core.TimeFieldApi>;
  /** The ordered segments for the current configuration. */
  segments: ComputedRef<TimeSegmentType[]>;
  /** The resolved parts, for placeholder rendering. */
  parts: ComputedRef<TimeParts>;
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

  const parts = ref<TimeParts>(core.parseValue(resolved.value.value));
  const buffer = ref("");
  const bufferSeg = ref<TimeSegmentType | null>(null);

  // The last value reported, so a commit that leaves the formatted value
  // unchanged (e.g. typing the first of two digits) stays quiet.
  let lastValue = core.format(parts.value, withSeconds.value);

  // Mirror an externally controlled value.
  watch(
    () => resolved.value.value,
    (next) => {
      parts.value = core.parseValue(next);
      buffer.value = "";
      bufferSeg.value = null;
      lastValue = core.format(parts.value, withSeconds.value);
    },
  );

  const commit = (
    nextParts: TimeParts,
    nextBuffer: string,
    nextBufferSeg: TimeSegmentType | null,
  ) => {
    parts.value = nextParts;
    buffer.value = nextBuffer;
    bufferSeg.value = nextBufferSeg;
    const next = core.format(nextParts, withSeconds.value);
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
        hourCycle: hourCycle.value,
        withSeconds: withSeconds.value,
        buffer: buffer.value,
        bufferSeg: bufferSeg.value,
        id,
      },
      commit,
      focus,
      normalize: normalizeProps,
    }),
  );

  return {
    api,
    segments: computed(() => core.segments(hourCycle.value, withSeconds.value)),
    parts: computed(() => parts.value),
  };
}
