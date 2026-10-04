import { timeField as core } from "@design-system/core";
import { useEffect, useId, useRef, useState, type FocusEvent, type RefObject } from "react";
import { useControlledDefault, useFormReset } from "../internal/form-reset";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import { normalizeProps } from "../normalize";

export type HourCycle = core.HourCycle;
export type TimeSegmentType = core.TimeSegmentType;
export type TimeValueError = core.TimeValueError;

export interface UseTimeFieldOptions {
  /** Initial (uncontrolled) or current (controlled) value, `HH:mm[:ss]` (24h), or `null`. */
  value?: string | null;
  /** 12 or 24 hours; 12 adds a day-period segment. Defaults to 24. */
  hourCycle?: HourCycle;
  /** Include a seconds segment. */
  withSeconds?: boolean;
  /** Earliest acceptable time (`HH:mm[:ss]`), inclusive. Reported, never enforced. */
  min?: string;
  /** Latest acceptable time (`HH:mm[:ss]`), inclusive. Reported, never enforced. */
  max?: string;
  /** Explicit base id; a stable one is generated when omitted. */
  id?: string;
  disabled?: boolean;
  /** Domain-level invalid state supplied by the consumer. */
  invalid?: boolean;
  /** Ids of visible description/error elements. */
  describedBy?: string;
  messages?: Partial<core.TimeFieldMessages>;
  /** Called with the canonical value when every required segment is filled, else `null`. */
  onValueChange?: (value: string | null) => void;
  /** Called when the user finishes editing: focus leaves the field, or Enter. */
  onValueCommit?: (value: string | null) => void;
  /** Called when an edit changes the structural error; `null` means none. */
  onValidationChange?: (error: TimeValueError | null) => void;
  /**
   * The field container. Given it, input from a soft keyboard is routed
   * through the segment logic instead of editing the segment text.
   */
  rootRef?: RefObject<HTMLElement | null>;
  /**
   * A form control inside the field, typically the hidden input carrying the
   * value. Given it, a reset of its form puts the value back, silently
   * (ADR 0012), and a disabled `<fieldset>` around it disables the field.
   */
  controlRef?: RefObject<HTMLInputElement | null>;
}

export interface UseTimeField extends core.TimeFieldApi {
  /** The segments to render, in order. */
  segments: TimeSegmentType[];
  /** Whether the field is disabled, by its prop or by a disabled fieldset. */
  disabled: boolean;
  /** Whether a segment shows its placeholder. */
  isPlaceholder(seg: TimeSegmentType): boolean;
}

/** The editing state a time field keeps of its own. */
type Draft = Pick<
  core.TimeFieldState,
  "parts" | "committedParts" | "validationError" | "invalidSegment" | "buffer" | "bufferSeg"
>;

/** A value from outside, parsed into a fresh draft. It is reflected, never reported. */
function parse(value: string | null, hourCycle: HourCycle, withSeconds: boolean): Draft {
  const parsed = core.parseTimeValue(value, { hourCycle, withSeconds });
  return {
    parts: parsed.parts,
    committedParts: parsed.parts,
    validationError: parsed.error,
    invalidSegment: parsed.invalidSegment,
    buffer: "",
    bufferSeg: null,
  };
}

const bound = (value: string | undefined) =>
  value && core.parseTimeValue(value).status === "valid" ? value : null;

/**
 * Connect the headless time field (segmented spinbuttons) to React. Digit
 * entry, stepping, commit boundaries and validation live in the core; this
 * hook owns the parts and the committed parts, mirrors an externally
 * controlled value without reporting (ADR 0011), and reports a structural
 * error only when an edit changes it. A value set from outside, or put back by
 * a form reset, updates `validationError` and reports nothing.
 */
export function useTimeField({
  value: valueProp = null,
  hourCycle = 24,
  withSeconds = false,
  min,
  max,
  id: idProp,
  disabled: disabledProp = false,
  invalid,
  describedBy,
  messages,
  onValueChange,
  onValueCommit,
  onValidationChange,
  rootRef,
  controlRef,
}: UseTimeFieldOptions = {}): UseTimeField {
  const generatedId = `ds-time-field-${useId()}`;
  const id = idProp ?? generatedId;
  const [draft, setDraft] = useState(() => parse(valueProp, hourCycle, withSeconds));
  const current = core.format(draft.parts, withSeconds, hourCycle);

  // A new shape reparses what the field holds, so 21:30 keeps its PM.
  const [shape, setShape] = useState({ hourCycle, withSeconds });
  if (shape.hourCycle !== hourCycle || shape.withSeconds !== withSeconds) {
    setShape({ hourCycle, withSeconds });
    const held = core.format(draft.parts, shape.withSeconds, shape.hourCycle);
    setDraft(parse(held ?? valueProp, hourCycle, withSeconds));
  }

  const defaultValue = useControlledDefault(valueProp, current, (next) => {
    const resolved = parse(next, hourCycle, withSeconds);
    // A parent echoing the draft back has accepted it: Escape must not revert
    // past what the consumer holds.
    if (
      resolved.validationError == null &&
      core.format(resolved.parts, withSeconds, hourCycle) === current
    ) {
      setDraft((d) => ({ ...d, committedParts: d.parts }));
    } else {
      setDraft(resolved);
    }
  });

  const own = useRef<HTMLInputElement>(null);
  const control = controlRef ?? own;
  useFormReset(control, () => setDraft(parse(defaultValue, hourCycle, withSeconds)));

  // The segments are spans, which a disabled fieldset does not reach; the
  // control inside the field tells whether one disables it.
  const [inDisabledFieldset, setInDisabledFieldset] = useState(false);
  const readFieldset = () =>
    setInDisabledFieldset(!disabledProp && (control.current?.matches(":disabled") ?? false));
  // Only the DOM knows the fieldset, and only once the field has committed.
  useIsomorphicLayoutEffect(readFieldset, [disabledProp, control]);
  const disabled = disabledProp || inDisabledFieldset;

  const api = core.connect({
    state: {
      ...draft,
      hourCycle,
      withSeconds,
      min: bound(min),
      max: bound(max),
      id,
    },
    setParts: (parts, buffer, bufferSeg) => {
      setDraft((d) => ({
        ...d,
        parts,
        buffer,
        bufferSeg,
        validationError: null,
        invalidSegment: null,
      }));
      if (draft.validationError) onValidationChange?.(null);
      const next = core.format(parts, withSeconds, hourCycle);
      if (next !== current) onValueChange?.(next);
    },
    setCommittedParts: (committedParts) =>
      setDraft((d) => (d.committedParts === committedParts ? d : { ...d, committedParts })),
    onCommit: (value) => onValueCommit?.(value),
    focus: (seg) => document.getElementById(core.segmentId(id, seg))?.focus(),
    invalid,
    disabled,
    describedBy,
    messages,
    normalize: normalizeProps,
  });

  // Soft keyboards send `beforeinput` rather than reliable key presses. React
  // reports a different event under that name, so the native one is answered
  // here and routed through the segment it targets.
  const latest = useRef(api);
  useIsomorphicLayoutEffect(() => {
    latest.current = api;
  });
  useEffect(() => {
    const root = rootRef?.current;
    if (!root) return;
    const listener = (event: Event) => {
      const seg = (event.target as HTMLElement).dataset?.segment as TimeSegmentType | undefined;
      if (!seg) return;
      const props = latest.current.getSegmentProps(seg) as { onBeforeInput: (e: Event) => void };
      props.onBeforeInput(event);
    };
    root.addEventListener("beforeinput", listener);
    return () => root.removeEventListener("beforeinput", listener);
  }, [rootRef]);

  return {
    ...api,
    segments: core.segments(hourCycle, withSeconds),
    disabled,
    isPlaceholder: (seg) => draft.parts[seg] == null,
    rootProps: {
      ...api.rootProps,
      // Moving between segments is editing; focus leaving the field is the end.
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        api.commit();
      },
      // A fieldset may have been disabled since the last render.
      onFocus: readFieldset,
    },
    // Two attributes React spells in camel case; renamed here rather than in
    // the shared normalizer, which every other control carries.
    getSegmentProps: (seg) => {
      const {
        onBeforeInput: _native,
        contenteditable: contentEditable,
        autocapitalize: autoCapitalize,
        ...props
      } = api.getSegmentProps(seg);
      return { ...props, contentEditable, autoCapitalize };
    },
  };
}
