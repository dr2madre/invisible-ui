import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import { initialState, parseTimeValue, rangeError, segments } from "./state";
import type { HourCycle, TimeSegmentType } from "./types";
import vectors from "./__vectors__/time-field.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

describe("time-field parse vectors", () => {
  for (const vector of vectors.parse) {
    const options = {
      withSeconds: vector.withSeconds,
      hourCycle: vector.hourCycle as HourCycle | undefined,
    };
    it(`${JSON.stringify(vector.value)} ${JSON.stringify(options)}`, () => {
      const result = parseTimeValue(vector.value, options);
      expect({
        status: result.status,
        canonical: result.canonical,
        error: result.error,
        invalidSegment: result.invalidSegment,
        normalized: result.normalized,
        dayPeriod: result.parts.dayPeriod,
      }).toEqual(vector.expect);
    });
  }
});

describe("time-field range vectors", () => {
  for (const { value, min, max, expect: expected } of vectors.range) {
    it(`${value} in [${min}, ${max}]`, () => {
      expect(rangeError(value, min, max)).toBe(expected);
    });
  }
});

describe("time-field key sequence vectors", () => {
  const typing: Array<(typeof vectors.typing)[number] & { min?: string; max?: string }> =
    vectors.typing;
  for (const vector of typing) {
    it(vector.name, () => {
      const hourCycle = vector.hourCycle as HourCycle;
      let state = initialState({
        value: vector.value,
        hourCycle,
        withSeconds: vector.withSeconds,
        min: vector.min,
        max: vector.max,
        id: "vectors",
      });
      const focus: TimeSegmentType[] = [];
      const commits: Array<string | null> = [];
      const handled: boolean[] = [];
      const build = () =>
        connect({
          state,
          setParts: (parts, buffer, bufferSeg) => {
            state = {
              ...state,
              parts,
              buffer,
              bufferSeg,
              validationError: null,
              invalidSegment: null,
            };
          },
          setCommittedParts: (committedParts) => {
            state = { ...state, committedParts };
          },
          onCommit: (value) => commits.push(value),
          focus: (seg) => focus.push(seg),
        });
      for (const { segment, key } of vector.keys) {
        let prevented = false;
        const onKeyDown = build().getSegmentProps(segment as TimeSegmentType).onKeyDown as (
          event: unknown,
        ) => void;
        onKeyDown({
          key,
          preventDefault() {
            prevented = true;
          },
          stopPropagation() {},
        });
        handled.push(prevented);
      }
      const api = build();
      const text = Object.fromEntries(
        segments(hourCycle, vector.withSeconds).map((seg) => [seg, api.getSegmentText(seg)]),
      );
      expect({
        value: api.value,
        status: api.status,
        error: api.validationError,
        text,
        focus,
        commits,
        handled,
      }).toEqual(vector.expect);
    });
  }
});
