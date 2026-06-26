import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { format, initialState, parseValue, segments } from "./state";
import type { TimeFieldState, TimeSegmentType } from "./types";

describe("time-field state", () => {
  it("parses and formats canonical strings", () => {
    expect(parseValue("09:30")).toEqual({ hour: 9, minute: 30, second: null });
    expect(parseValue("23:05:07")).toEqual({ hour: 23, minute: 5, second: 7 });
    expect(parseValue("bad")).toEqual({ hour: null, minute: null, second: null });
    expect(format({ hour: 9, minute: 3, second: null }, false)).toBe("09:03");
    expect(format({ hour: 9, minute: 3, second: 5 }, true)).toBe("09:03:05");
    expect(format({ hour: 9, minute: null, second: null }, false)).toBeNull();
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
    const h = harness(base({ parts: { hour: 23, minute: 59, second: null } }));
    h.key("hour", "ArrowUp");
    expect(h.parts().hour).toBe(0); // wraps 23 → 0
    h.key("minute", "ArrowUp");
    expect(h.parts().minute).toBe(0); // wraps 59 → 0
    h.key("hour", "ArrowDown");
    expect(h.parts().hour).toBe(23); // wraps 0 → 23
  });

  it("types two digits then auto-advances to the next segment", () => {
    const h = harness(base({ parts: { hour: null, minute: null, second: null } }));
    h.key("hour", "1");
    expect(h.parts().hour).toBe(1);
    expect(h.focused).toEqual([]); // 1 could become 10–19, keep buffering
    h.key("hour", "2");
    expect(h.parts().hour).toBe(12);
    expect(h.focused).toEqual(["minute"]); // full → advance
  });

  it("auto-advances immediately when a digit can't take a second one", () => {
    const h = harness(base({ parts: { hour: null, minute: null, second: null } }));
    h.key("hour", "5"); // 5*10 = 50 > 23 → commit + advance
    expect(h.parts().hour).toBe(5);
    expect(h.focused).toEqual(["minute"]);
  });

  it("clears a segment with Backspace and reports null value when incomplete", () => {
    const h = harness(base({ parts: { hour: 10, minute: 20, second: null } }));
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
    const h = harness(base({ parts: { hour: 9, minute: 0, second: null }, hourCycle: 12 }));
    expect(h.text("dayPeriod")).toBe("AM");
    h.key("dayPeriod", "p");
    expect(h.parts().hour).toBe(21); // 9 AM → 9 PM
    expect(h.text("dayPeriod")).toBe("PM");
    expect(h.text("hour")).toBe("09"); // display stays 09 in 12h
  });
});
