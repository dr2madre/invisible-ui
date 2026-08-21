import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { bounds, format, from12, pad2, rangeError, segmentId, segments, to12 } from "./state";
import type {
  DayPeriod,
  TimeFieldState,
  TimeInputStatus,
  TimeParts,
  TimeSegmentType,
  TimeValueError,
} from "./types";

export interface TimeFieldMessages {
  hour: string;
  minute: string;
  second: string;
  dayPeriod: string;
  empty: string;
  dayPeriodPlaceholder: string;
}

export interface TimeFieldApi {
  /** The formatted value (`HH:mm[:ss]`), or `null` when incomplete. */
  value: string | null;
  status: TimeInputStatus;
  validationError: TimeValueError | null;
  /** Report that editing finished (focus left the field, or Enter). */
  commit(): void;
  /** Put the parts back to the last finished state; `false` if nothing to undo. */
  revert(): boolean;
  /** Props for the field container (`role="group"`). */
  rootProps: ElementProps;
  /** Props for a segment (`role="spinbutton"`), by type. */
  getSegmentProps(seg: TimeSegmentType): ElementProps;
  /** Display text for a segment (padded value or placeholder). */
  getSegmentText(seg: TimeSegmentType): string;
}

export interface ConnectOptions {
  state: TimeFieldState;
  /** Apply new parts + digit-entry buffer (the adapter owns state + onValueChange). */
  setParts: (parts: TimeParts, buffer: string, bufferSeg: TimeSegmentType | null) => void;
  /** Record the parts as finished, so Escape has something to put back. */
  setCommittedParts: (parts: TimeParts) => void;
  /** Report that the user finished editing (the adapter owns onValueCommit). */
  onCommit?: (value: string | null) => void;
  /** Move DOM focus to a segment (adapter-provided). */
  focus?: (seg: TimeSegmentType) => void;
  /** Domain-level invalid state supplied by the consumer. */
  invalid?: boolean;
  /** Prevent editing while preserving readable segment values. */
  disabled?: boolean;
  /** Ids of visible description/error elements. */
  describedBy?: string;
  messages?: Partial<TimeFieldMessages>;
  normalize?: Normalize;
}

const PLACEHOLDER: Record<TimeSegmentType, string> = {
  hour: "hh",
  minute: "mm",
  second: "ss",
  dayPeriod: "--",
};

const DEFAULT_MESSAGES: TimeFieldMessages = {
  hour: "Hour",
  minute: "Minute",
  second: "Second",
  dayPeriod: "AM/PM",
  empty: "Empty",
  dayPeriodPlaceholder: "--",
};

const wrap = (n: number, mod: number) => ((n % mod) + mod) % mod;

export function connect({
  state,
  setParts,
  setCommittedParts,
  onCommit,
  focus,
  invalid = false,
  disabled = false,
  describedBy,
  messages: messageOverrides,
  normalize = identityNormalize,
}: ConnectOptions): TimeFieldApi {
  const { parts, hourCycle, withSeconds, buffer, bufferSeg, id, validationError } = state;
  const order = segments(hourCycle, withSeconds);
  const messages = { ...DEFAULT_MESSAGES, ...messageOverrides };

  const displayValue = (seg: TimeSegmentType): number | null => {
    if (seg === "hour")
      return parts.hour == null ? null : hourCycle === 12 ? to12(parts.hour) : parts.hour;
    if (seg === "minute") return parts.minute;
    if (seg === "second") return parts.second;
    return null;
  };

  const withPart = (seg: TimeSegmentType, raw: number | null): TimeParts => {
    const next: TimeParts = { ...parts };
    if (seg === "hour") {
      if (raw == null) next.hour = null;
      else if (hourCycle === 12) {
        next.hour = parts.dayPeriod == null ? raw : from12(raw, parts.dayPeriod);
      } else next.hour = raw;
    } else if (seg === "minute") next.minute = raw;
    else if (seg === "second") next.second = raw;
    return next;
  };

  const stepNumeric = (seg: TimeSegmentType, dir: 1 | -1) => {
    const { min, max } = bounds(seg, hourCycle);
    const current = displayValue(seg);
    const base = current == null ? (dir === 1 ? min - 1 : min) : current;
    const span = max - min + 1;
    const nextRaw = min + wrap(base - min + dir, span);
    setParts(withPart(seg, nextRaw), "", null);
  };

  const togglePeriod = (to?: DayPeriod) => {
    const currentPeriod = parts.dayPeriod;
    const period = to ?? (currentPeriod === "AM" ? "PM" : "AM");
    const displayHour =
      parts.hour == null ? null : currentPeriod == null ? parts.hour : to12(parts.hour);
    const next: TimeParts = {
      ...parts,
      dayPeriod: period,
      hour: displayHour == null ? null : from12(displayHour, period),
    };
    setParts(next, "", null);
  };

  const typeDigit = (seg: TimeSegmentType, digit: string) => {
    const { max } = bounds(seg, hourCycle);
    const buf = bufferSeg === seg ? buffer + digit : digit;
    const cand = Number(buf);
    // Keep focus and the previous value instead of silently treating the last
    // digit as a new value (for example, turning an attempted 25 into 05).
    if (cand > max) return;
    // 12h hour: a lone 0 isn't valid yet — keep buffering for a second digit.
    const tooSmall = seg === "hour" && hourCycle === 12 && cand === 0;
    const full = !tooSmall && (buf.length >= 2 || cand * 10 > max);
    const next = withPart(seg, tooSmall ? null : cand);
    if (full) {
      setParts(next, "", null);
      const i = order.indexOf(seg);
      if (i < order.length - 1) focus?.(order[i + 1]!);
    } else {
      setParts(next, buf, seg);
    }
  };

  const clear = (seg: TimeSegmentType) => {
    if (seg === "dayPeriod") {
      setParts({ ...parts, dayPeriod: null }, "", null);
      return;
    }
    setParts(withPart(seg, null), "", null);
  };

  const move = (seg: TimeSegmentType, dir: 1 | -1) => {
    const i = order.indexOf(seg);
    const target = order[i + dir];
    if (target) focus?.(target);
  };

  const onKeyDown = (seg: TimeSegmentType) => (event: Event) => {
    if (disabled) return;
    const e = event as KeyboardEvent;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (seg === "dayPeriod") togglePeriod();
        else stepNumeric(seg, 1);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (seg === "dayPeriod") togglePeriod();
        else stepNumeric(seg, -1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        move(seg, -1);
        break;
      case "ArrowRight":
        e.preventDefault();
        move(seg, 1);
        break;
      case "Backspace":
      case "Delete":
        e.preventDefault();
        clear(seg);
        break;
      case "Enter":
        // No preventDefault: native form submission must still happen.
        commitValue();
        break;
      case "Escape":
        // Only when there is something to undo, so an outer dialog still
        // closes on the next Escape.
        if (revert()) {
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      default:
        if (seg === "dayPeriod") {
          if (e.key.toLowerCase() === "a") {
            e.preventDefault();
            togglePeriod("AM");
          } else if (e.key.toLowerCase() === "p") {
            e.preventDefault();
            togglePeriod("PM");
          }
        } else if (/^\d$/.test(e.key)) {
          e.preventDefault();
          typeDigit(seg, e.key);
        }
    }
  };

  // Mobile soft keyboards don't emit reliable keydown digits; contenteditable
  // segments fire `beforeinput` instead. We never let the element edit itself —
  // we read the inserted data and route it through the same spinbutton logic.
  // (On desktop, the keydown handler preventDefaults printable keys, so this
  // does not double-fire.)
  const onBeforeInput = (seg: TimeSegmentType) => (event: Event) => {
    const e = event as InputEvent;
    e.preventDefault?.();
    if (disabled) return;
    if ((e.inputType ?? "").startsWith("delete")) {
      clear(seg);
      return;
    }
    const data = e.data ?? "";
    if (seg === "dayPeriod") {
      const c = data.toLowerCase();
      if (c.includes("a")) togglePeriod("AM");
      else if (c.includes("p")) togglePeriod("PM");
      return;
    }
    const digit = data.replace(/\D/g, "").slice(-1);
    if (digit) typeDigit(seg, digit);
  };

  const getSegmentText = (seg: TimeSegmentType): string => {
    if (seg === "dayPeriod") {
      return parts.dayPeriod ?? messages.dayPeriodPlaceholder;
    }
    const v = displayValue(seg);
    return v == null ? PLACEHOLDER[seg] : pad2(v);
  };

  const committedValue = format(state.committedParts, withSeconds, hourCycle);

  /** Report that editing finished. A repeat with nothing new stays quiet. */
  const commitValue = () => {
    const current = format(parts, withSeconds, hourCycle);
    setCommittedParts(parts);
    if (current !== committedValue) onCommit?.(current);
  };

  /** Put the parts back to the last finished state (Escape). */
  const revert = () => {
    if (
      format(state.committedParts, withSeconds, hourCycle) ===
        format(parts, withSeconds, hourCycle) &&
      state.committedParts === parts
    ) {
      return false;
    }
    setParts(state.committedParts, "", null);
    return true;
  };

  const value = format(parts, withSeconds, hourCycle);
  // A time outside the accepted range is reported, never corrected: the arrows
  // keep wrapping, and the field says what the value is.
  const error = validationError ?? rangeError(value, state.min, state.max);
  const isEmpty =
    parts.hour == null && parts.minute == null && parts.second == null && parts.dayPeriod == null;
  const status: TimeInputStatus = error
    ? "invalid"
    : value != null
      ? "valid"
      : isEmpty
        ? "empty"
        : "incomplete";
  const isInvalid = invalid || error != null;

  return {
    value,
    status,
    validationError: error,
    commit: commitValue,
    revert,
    rootProps: normalize({
      role: "group",
      "aria-invalid": isInvalid || undefined,
      "aria-describedby": describedBy,
      "aria-disabled": disabled || undefined,
      "data-status": status,
    }),
    getSegmentText,
    getSegmentProps: (seg: TimeSegmentType) => {
      if (seg === "dayPeriod") {
        const period = parts.dayPeriod;
        return normalize({
          role: "spinbutton",
          id: segmentId(id, seg),
          tabindex: disabled ? -1 : 0,
          contenteditable: disabled ? "false" : "true",
          inputmode: "text",
          spellcheck: false,
          autocapitalize: "none",
          "data-segment": seg,
          "aria-label": messages.dayPeriod,
          "aria-valuetext": period ?? messages.empty,
          "aria-valuemin": 0,
          "aria-valuemax": 1,
          "aria-valuenow": period == null ? undefined : period === "PM" ? 1 : 0,
          onKeyDown: onKeyDown(seg),
          onBeforeInput: onBeforeInput(seg),
          onClick: () => {
            if (!disabled) togglePeriod();
          },
        });
      }
      const { min, max } = bounds(seg, hourCycle);
      const v = displayValue(seg);
      return normalize({
        role: "spinbutton",
        id: segmentId(id, seg),
        tabindex: disabled ? -1 : 0,
        contenteditable: disabled ? "false" : "true",
        inputmode: "numeric",
        spellcheck: false,
        autocapitalize: "none",
        "data-segment": seg,
        "aria-label": messages[seg],
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": v ?? undefined,
        "aria-valuetext": v == null ? messages.empty : pad2(v),
        "aria-invalid": state.invalidSegment === seg || undefined,
        onKeyDown: onKeyDown(seg),
        onBeforeInput: onBeforeInput(seg),
      });
    },
  };
}
