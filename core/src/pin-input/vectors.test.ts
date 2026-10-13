import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState, keyTarget, sanitizeChar, splitValue } from "./state";
import type { Dir } from "../i18n/locale";
import type { PinInputType } from "./types";
import vectors from "./__vectors__/pin-input.json";

// The shared vectors are language-neutral: the Flutter adapter reads the same
// file, so both implementations answer the same cases.

/** What a paste of `text` into cell `index` commits and focuses. */
function paste(values: string[], index: number, text: string, type: PinInputType) {
  const setValues = vi.fn();
  const focus = vi.fn();
  const state = { ...initialState({ length: values.length, type, id: "x" }), values };
  const api = connect({ state, setValues, focus });
  const event = {
    preventDefault: () => {},
    clipboardData: { getData: () => text },
  } as unknown as Event;
  (api.getInputProps(index).onPaste as (e: Event) => void)(event);
  const committed = setValues.mock.calls[0]?.[0] as string[] | undefined;
  const focused = focus.mock.calls[0]?.[0] as number | undefined;
  return committed ? { values: committed, focus: focused } : null;
}

/** Where the keydown handler of `connect` moves the focus for `key`. */
function press(key: string, index: number, length: number, direction: Dir) {
  const focus = vi.fn();
  const preventDefault = vi.fn();
  const state = initialState({ length, id: "x" });
  const api = connect({ state, setValues: () => {}, focus, direction });
  (api.getInputProps(index).onKeyDown as (e: Event) => void)({
    key,
    preventDefault,
  } as unknown as Event);
  return {
    focus: focus.mock.calls[0]?.[0] as number | undefined,
    prevented: preventDefault.mock.calls.length > 0,
  };
}

describe("pin input vectors", () => {
  for (const v of vectors.split) {
    it(`split: ${v.name}`, () => {
      expect(splitValue(v.value, v.length)).toEqual(v.expect);
    });
  }
  for (const v of vectors.sanitize) {
    it(`sanitize: ${v.name}`, () => {
      expect(sanitizeChar(v.char, v.type as PinInputType)).toBe(v.expect);
    });
  }
  for (const v of vectors.paste) {
    it(`paste: ${v.name}`, () => {
      expect(paste(v.values, v.index, v.text, v.type as PinInputType)).toEqual(v.expect);
    });
  }
  for (const v of vectors.keys) {
    it(`keys: ${v.name}`, () => {
      const direction = v.direction as Dir;
      expect(keyTarget(v.key, v.index, v.length, direction)).toBe(v.expect);
      // The keydown handler moves the focus there.
      const { focus, prevented } = press(v.key, v.index, v.length, direction);
      expect(focus).toBe(v.expect ?? undefined);
      expect(prevented).toBe(v.expect !== null);
    });
  }
});
