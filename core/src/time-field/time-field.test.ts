import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { format, initialState, parseTimeValue, parseValue, segments } from "./state";
import type { TimeFieldState, TimeSegmentType } from "./types";

describe("time-field state", () => {
  it("normalizes complete, semantically valid values", () => {
    expect(parseTimeValue("9:30")).toMatchObject({
      status: "valid",
      canonical: "09:30",
      normalized: true,
    });
    expect(parseValue("09:30")).toEqual({
      hour: 9,
      minute: 30,
      second: null,
      dayPeriod: null,
    });
    expect(parseValue("23:05:07")).toEqual({
      hour: 23,
      minute: 5,
      second: 7,
      dayPeriod: null,
    });
  });

  it("rejects malformed and out-of-range values atomically", () => {
    expect(parseTimeValue("bad")).toMatchObject({ status: "invalid", error: "invalid-format" });
    expect(parseTimeValue("25:30")).toMatchObject({
      status: "invalid",
      error: "out-of-range",
      invalidSegment: "hour",
      parts: { hour: null, minute: null, second: null, dayPeriod: null },
    });
    expect(parseTimeValue("09:70")).toMatchObject({
      status: "invalid",
      invalidSegment: "minute",
    });
  });

  it("validates seconds against the configured presentation", () => {
    expect(parseTimeValue("09:30", { withSeconds: true }).error).toBe("seconds-required");
    expect(parseTimeValue("09:30:15", { withSeconds: false }).error).toBe("seconds-not-allowed");
  });

  it("formats only complete values and requires an explicit 12h period", () => {
    expect(format({ hour: 9, minute: 3, second: null, dayPeriod: null }, false)).toBe("09:03");
    expect(format({ hour: 9, minute: 3, second: 5, dayPeriod: null }, true)).toBe("09:03:05");
    expect(format({ hour: 9, minute: null, second: null, dayPeriod: null }, false)).toBeNull();
    expect(format({ hour: 9, minute: 3, second: null, dayPeriod: null }, false, 12)).toBeNull();
    expect(format({ hour: 21, minute: 3, second: null, dayPeriod: "PM" }, false, 12)).toBe("21:03");
  });

  it("lists segments per configuration", () => {
    expect(segments(24, false)).toEqual(["hour", "minute"]);
    expect(segments(24, true)).toEqual(["hour", "minute", "second"]);
    expect(segments(12, false)).toEqual(["hour", "minute", "dayPeriod"]);
  });
});

describe("time-field connect", () => {
  const base = (over: Partial<TimeFieldState> = {}): TimeFieldState => ({
    ...initialState({ value: "10:20", hourCycle: 24, withSeconds: false }),
    ...over,
  });

  const harness = (state: TimeFieldState) => {
    let current = state;
    const focused: TimeSegmentType[] = [];
    const make = () =>
      connect({
        state: current,
        commit: (parts, buffer, bufferSeg) => {
          current = { ...current, parts, buffer, bufferSeg };
        },
        focus: (seg) => focused.push(seg),
      });
    const key = (seg: TimeSegmentType, k: string) => {
      const handler = make().getSegmentProps(seg).onKeyDown as (e: Event) => void;
      handler({ key: k, preventDefault() {} } as unknown as Event);
    };
    return {
      key,
      focused,
      parts: () => current.parts,
      value: () => make().value,
      text: (seg: TimeSegmentType) => make().getSegmentText(seg),
    };
  };

  it("increments and wraps with ArrowUp/Down", () => {
    const h = harness(base({ parts: { hour: 23, minute: 59, second: null, dayPeriod: null } }));
    h.key("hour", "ArrowUp");
    expect(h.parts().hour).toBe(0); // wraps 23 → 0
    h.key("minute", "ArrowUp");
    expect(h.parts().minute).toBe(0); // wraps 59 → 0
    h.key("hour", "ArrowDown");
    expect(h.parts().hour).toBe(23); // wraps 0 → 23
  });

  it("types two digits then auto-advances to the next segment", () => {
    const h = harness(base({ parts: { hour: null, minute: null, second: null, dayPeriod: null } }));
    h.key("hour", "1");
    expect(h.parts().hour).toBe(1);
    expect(h.focused).toEqual([]); // 1 could become 10–19, keep buffering
    h.key("hour", "2");
    expect(h.parts().hour).toBe(12);
    expect(h.focused).toEqual(["minute"]); // full → advance
  });

  it("auto-advances immediately when a digit can't take a second one", () => {
    const h = harness(base({ parts: { hour: null, minute: null, second: null, dayPeriod: null } }));
    h.key("hour", "5"); // 5*10 = 50 > 23 → commit + advance
    expect(h.parts().hour).toBe(5);
    expect(h.focused).toEqual(["minute"]);
  });

  it("clears a segment with Backspace and reports null value when incomplete", () => {
    const h = harness(base({ parts: { hour: 10, minute: 20, second: null, dayPeriod: null } }));
    expect(h.value()).toBe("10:20");
    h.key("minute", "Backspace");
    expect(h.parts().minute).toBeNull();
    expect(h.value()).toBeNull();
  });

  it("moves focus between segments with arrows", () => {
    const h = harness(base());
    h.key("hour", "ArrowRight");
    h.key("minute", "ArrowLeft");
    expect(h.focused).toEqual(["minute", "hour"]);
  });

  it("toggles AM/PM in 12-hour mode", () => {
    const h = harness(
      base({
        parts: { hour: 9, minute: 0, second: null, dayPeriod: "AM" },
        hourCycle: 12,
      }),
    );
    expect(h.text("dayPeriod")).toBe("AM");
    h.key("dayPeriod", "p");
    expect(h.parts().hour).toBe(21); // 9 AM → 9 PM
    expect(h.text("dayPeriod")).toBe("PM");
    expect(h.text("hour")).toBe("09"); // display stays 09 in 12h
  });

  it("does not infer AM while a 12h value is incomplete", () => {
    const h = harness(
      base({
        parts: { hour: null, minute: null, second: null, dayPeriod: null },
        hourCycle: 12,
      }),
    );
    h.key("hour", "9");
    h.key("minute", "3");
    h.key("minute", "0");
    expect(h.text("dayPeriod")).toBe("--");
    expect(h.value()).toBeNull();
    h.key("dayPeriod", "p");
    expect(h.value()).toBe("21:30");
  });

  it("does not reinterpret an impossible second digit", () => {
    const h = harness(base({ parts: { hour: null, minute: 0, second: null, dayPeriod: null } }));
    h.key("hour", "2");
    h.key("hour", "5");
    expect(h.parts().hour).toBe(2);
    expect(h.focused).toEqual([]);
  });
});
