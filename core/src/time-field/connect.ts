import { identityNormalize, type ElementProps, type Normalize } from "../types";
import { bounds, format, pad2, periodOf, segmentId, segments, to12 } from "./state";
import type { TimeFieldState, TimeParts, TimeSegmentType } from "./types";

export interface TimeFieldApi {
  /** The formatted value (`HH:mm[:ss]`), or `null` when incomplete. */
  value: string | null;
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
  commit: (parts: TimeParts, buffer: string, bufferSeg: TimeSegmentType | null) => void;
  /** Move DOM focus to a segment (adapter-provided). */
  focus?: (seg: TimeSegmentType) => void;
  normalize?: Normalize;
}

const PLACEHOLDER: Record<TimeSegmentType, string> = {
  hour: "hh",
  minute: "mm",
  second: "ss",
  dayPeriod: "AM",
};

const wrap = (n: number, mod: number) => ((n % mod) + mod) % mod;

export function connect({
  state,
  commit,
  focus,
  normalize = identityNormalize,
}: ConnectOptions): TimeFieldApi {
  const { parts, hourCycle, withSeconds, buffer, bufferSeg, id } = state;
  const order = segments(hourCycle, withSeconds);

  const displayValue = (seg: TimeSegmentType): number | null => {
    if (seg === "hour")
      return parts.hour == null ? null : hourCycle === 12 ? to12(parts.hour) : parts.hour;
    if (seg === "minute") return parts.minute;
    if (seg === "second") return parts.second;
    return null;
  };

  const setHourFrom12 = (display: number, period: "AM" | "PM"): number => {
    const h = display % 12;
    return period === "PM" ? h + 12 : h;
  };

  const withPart = (seg: TimeSegmentType, raw: number | null): TimeParts => {
    const next: TimeParts = { ...parts };
    if (seg === "hour") {
      if (raw == null) next.hour = null;
      else if (hourCycle === 12) {
        const period = parts.hour != null ? periodOf(parts.hour) : "AM";
        next.hour = setHourFrom12(raw, period);
      } else next.hour = raw;
    } else if (seg === "minute") next.minute = raw;
    else if (seg === "second") next.second = raw;
    return next;
  };

  const stepNumeric = (seg: TimeSegmentType, dir: 1 | -1) => {
    const mod = seg === "hour" ? 24 : 60;
    // hour uses the internal 0–23 domain so 12h wraps through AM/PM correctly.
    const cur = seg === "hour" ? parts.hour : seg === "minute" ? parts.minute : parts.second;
    const base = cur == null ? (dir === 1 ? -1 : 0) : cur;
    const nextRaw = wrap(base + dir, mod);
    const next: TimeParts = { ...parts };
    if (seg === "hour") next.hour = nextRaw;
    else if (seg === "minute") next.minute = nextRaw;
    else next.second = nextRaw;
    commit(next, "", null);
  };

  const togglePeriod = (to?: "AM" | "PM") => {
    const cur = parts.hour ?? 0;
    const period = to ?? (periodOf(cur) === "AM" ? "PM" : "AM");
    const next: TimeParts = { ...parts, hour: setHourFrom12(to12(cur), period) };
    commit(next, "", null);
  };

  const typeDigit = (seg: TimeSegmentType, digit: string) => {
    const { max } = bounds(seg, hourCycle);
    let buf = bufferSeg === seg ? buffer + digit : digit;
    let cand = Number(buf);
    if (cand > max) {
      buf = digit;
      cand = Number(digit);
    }
    // 12h hour: a lone 0 isn't valid yet — keep buffering for a second digit.
    const tooSmall = seg === "hour" && hourCycle === 12 && cand === 0;
    const full = !tooSmall && (buf.length >= 2 || cand * 10 > max);
    const next = withPart(seg, tooSmall ? null : cand);
    if (full) {
      commit(next, "", null);
      const i = order.indexOf(seg);
      if (i < order.length - 1) focus?.(order[i + 1]!);
    } else {
      commit(next, buf, seg);
    }
  };

  const clear = (seg: TimeSegmentType) => {
    if (seg === "dayPeriod") return;
    commit(withPart(seg, null), "", null);
  };

  const move = (seg: TimeSegmentType, dir: 1 | -1) => {
    const i = order.indexOf(seg);
    const target = order[i + dir];
    if (target) focus?.(target);
  };

  const onKeyDown = (seg: TimeSegmentType) => (event: Event) => {
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

  const getSegmentText = (seg: TimeSegmentType): string => {
    if (seg === "dayPeriod") {
      return parts.hour == null ? PLACEHOLDER.dayPeriod : periodOf(parts.hour);
    }
    const v = displayValue(seg);
    return v == null ? PLACEHOLDER[seg] : pad2(v);
  };

  return {
    value: format(parts, withSeconds),
    rootProps: normalize({ role: "group" }),
    getSegmentText,
    getSegmentProps: (seg: TimeSegmentType) => {
      if (seg === "dayPeriod") {
        const period = parts.hour == null ? null : periodOf(parts.hour);
        return normalize({
          role: "spinbutton",
          id: segmentId(id, seg),
          tabindex: 0,
          "data-segment": seg,
          "aria-label": "AM/PM",
          "aria-valuetext": period ?? "Empty",
          "aria-valuemin": 0,
          "aria-valuemax": 1,
          "aria-valuenow": period === "PM" ? 1 : 0,
          onKeyDown: onKeyDown(seg),
        });
      }
      const { min, max } = bounds(seg, hourCycle);
      const v = displayValue(seg);
      return normalize({
        role: "spinbutton",
        id: segmentId(id, seg),
        tabindex: 0,
        "data-segment": seg,
        "aria-label": seg,
        "aria-valuemin": min,
        "aria-valuemax": max,
        "aria-valuenow": v ?? undefined,
        "aria-valuetext": v == null ? "Empty" : pad2(v),
        onKeyDown: onKeyDown(seg),
      });
    },
  };
}
