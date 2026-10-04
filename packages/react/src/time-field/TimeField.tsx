import { i18n as coreI18n } from "@design-system/core";
import { Fragment, useId, useRef } from "react";
import { useI18n } from "../i18n/i18n";
import type { MessageKey } from "../i18n/messages";
import { cx } from "../internal/cx";
import { useTimeField, type HourCycle, type TimeValueError } from "./use-time-field";

export interface TimeFieldProps {
  /** Initial (uncontrolled) or current (controlled) value, `HH:mm[:ss]` (24h), or `null`. */
  value?: string | null;
  /** 12 or 24 hours. Defaults to the provider locale's preference. */
  hourCycle?: HourCycle;
  /** Include a seconds segment. */
  withSeconds?: boolean;
  disabled?: boolean;
  /** Domain-level invalid state. Structural time errors are detected automatically. */
  invalid?: boolean;
  /** Visible, actionable error text supplied by the application. */
  error?: string;
  /** Accessible label for the whole field. Defaults to the catalog's. */
  label?: string;
  /** Form field name; the canonical time (`HH:mm[:ss]`) is submitted under it. */
  name?: string;
  /** Id of the owning form when the field renders outside of it. */
  form?: string;
  /** Earliest acceptable time (`HH:mm[:ss]`), inclusive. Reported, never enforced. */
  min?: string;
  /** Latest acceptable time (`HH:mm[:ss]`), inclusive. Reported, never enforced. */
  max?: string;
  /** Called with the canonical value when every required segment is filled, else `null`. */
  onValueChange?: (value: string | null) => void;
  /** Called when the user finishes editing: focus leaves the field, or Enter. */
  onValueCommit?: (value: string | null) => void;
  /** Called when an edit changes the structural error; `null` means none. */
  onValidationChange?: (error: TimeValueError | null) => void;
}

/**
 * The hour cycle a locale prefers. Read from a formatter's resolved options,
 * which every runtime answers alike, so the server and the browser render
 * the same segments.
 */
function localeHourCycle(locale: string): HourCycle {
  const cycle = coreI18n.dateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h11" || cycle === "h12" ? 12 : 24;
}

/** The catalog message for each way a time can be wrong. */
const MESSAGES: Record<TimeValueError, MessageKey> = {
  "invalid-format": "timeField.invalidFormat",
  "out-of-range": "timeField.outOfRange",
  "seconds-required": "timeField.secondsRequired",
  "seconds-not-allowed": "timeField.secondsNotAllowed",
  "range-underflow": "timeField.rangeUnderflow",
  "range-overflow": "timeField.rangeOverflow",
};

/**
 * TimeField: a segmented time input (hour : minute [: second] [AM/PM]). Each
 * segment is a `role="spinbutton"` driven by the headless time field
 * (`useTimeField`): ArrowUp and ArrowDown step with wrapping, ArrowLeft and
 * ArrowRight move between segments, digits type with auto-advance, Backspace
 * clears, A and P set the period, Escape puts back the last finished value.
 * The value is the canonical 24-hour string (`HH:mm` or `HH:mm:ss`), `null`
 * while a segment is empty. The hour cycle follows the provider's locale
 * unless `hourCycle` says otherwise; labels come from the catalog.
 *
 * With `name`, a hidden input submits the value, and a form reset puts back
 * the current default without reporting (ADR 0012). Inside a disabled
 * `<fieldset>` the field is disabled too. A time outside `min` and `max` is
 * reported, never corrected. Themeable via `--ds-time-field-*`.
 */
export function TimeField({
  value = null,
  hourCycle,
  withSeconds = false,
  disabled = false,
  invalid = false,
  error,
  label,
  name,
  form,
  min,
  max,
  onValueChange,
  onValueCommit,
  onValidationChange,
}: TimeFieldProps) {
  const { t, locale } = useI18n();
  const errorId = `ds-time-field-${useId()}-error`;
  const rootRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const api = useTimeField({
    value,
    hourCycle: hourCycle ?? localeHourCycle(locale),
    withSeconds,
    min,
    max,
    disabled,
    invalid: invalid || Boolean(error),
    describedBy: errorId,
    messages: {
      hour: t("timeField.hour"),
      minute: t("timeField.minute"),
      second: t("timeField.second"),
      dayPeriod: t("timeField.dayPeriod"),
      empty: t("timeField.empty"),
    },
    onValueChange,
    onValueCommit,
    onValidationChange,
    rootRef,
    controlRef: hiddenRef,
  });

  const message =
    error ??
    (api.validationError
      ? t(MESSAGES[api.validationError], { min: min ?? "", max: max ?? "" })
      : undefined);
  const isInvalid = invalid || Boolean(message);

  return (
    <div className="time-field-control">
      <div
        {...api.rootProps}
        ref={rootRef}
        className={cx(
          "time-field",
          api.disabled && "time-field--disabled",
          isInvalid && "time-field--invalid",
        )}
        aria-label={label ?? t("timeField.label")}
        aria-invalid={isInvalid || undefined}
        aria-describedby={message ? errorId : undefined}
      >
        {/* Always present: it tells a form reset which form the field is in,
            and a disabled fieldset whether it disables the field. Only a
            named input is submitted, and a disabled one sends nothing. */}
        <input
          ref={hiddenRef}
          type="hidden"
          name={name}
          form={form}
          value={api.value ?? ""}
          disabled={disabled || undefined}
        />
        {api.segments.map((seg, index) => (
          <Fragment key={seg}>
            {index > 0 ? (
              <span className="time-field__separator" aria-hidden="true">
                {seg === "dayPeriod" ? " " : ":"}
              </span>
            ) : null}
            <span
              {...api.getSegmentProps(seg)}
              className={cx(
                "time-field__segment",
                api.isPlaceholder(seg) && "time-field__segment--placeholder",
                seg === "dayPeriod" && "time-field__segment--period",
              )}
              // The core intercepts every edit; React keeps the text.
              suppressContentEditableWarning
            >
              {api.getSegmentText(seg)}
            </span>
          </Fragment>
        ))}
      </div>
      <p id={errorId} className="time-field__error" aria-live="polite" hidden={!message}>
        {message ?? ""}
      </p>
    </div>
  );
}
