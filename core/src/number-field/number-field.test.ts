import { describe, expect, it } from "vitest";
import { connect } from "./connect";
import {
  canonicalString,
  decimalsOf,
  formatNumber,
  initialState,
  parseNumber,
  snapToStep,
  validate,
} from "./state";
import type { NumberFieldContext } from "./types";

describe("number-field parsing", () => {
  it("parses plain and grouped English input", () => {
    expect(parseNumber("1234.5", "en")).toMatchObject({ status: "valid", value: 1234.5 });
    expect(parseNumber("1,234.5", "en")).toMatchObject({ status: "valid", value: 1234.5 });
    // Group separators are accepted anywhere and stripped, wherever typed.
    expect(parseNumber("1,2,3", "en")).toMatchObject({ status: "valid", value: 123 });
    expect(parseNumber(" 42 ", "en")).toMatchObject({ status: "valid", value: 42 });
    expect(parseNumber("+3", "en")).toMatchObject({ status: "valid", value: 3 });
    expect(parseNumber("-7.25", "en")).toMatchObject({ status: "valid", value: -7.25 });
  });

  it("parses comma-decimal locales without corrupting the value", () => {
    expect(parseNumber("1,5", "it-IT")).toMatchObject({ status: "valid", value: 1.5 });
    expect(parseNumber("1.234,5", "it-IT")).toMatchObject({ status: "valid", value: 1234.5 });
    expect(parseNumber("1.234,56", "de-DE")).toMatchObject({ status: "valid", value: 1234.56 });
  });

  it("parses the locale's own digits and ASCII digits alike", () => {
    expect(parseNumber("١٥", "ar-EG")).toMatchObject({ status: "valid", value: 15 });
    expect(parseNumber("١٥٫٥", "ar-EG")).toMatchObject({
      status: "valid",
      value: 15.5,
    });
    expect(parseNumber("١٬٠٠٠", "ar-EG")).toMatchObject({
      status: "valid",
      value: 1000,
    });
    expect(parseNumber("15.5", "ar-EG")).toMatchObject({ status: "valid", value: 15.5 });
  });

  it("classifies transient drafts as empty or incomplete", () => {
    expect(parseNumber("", "en")).toMatchObject({ status: "empty", value: null });
    expect(parseNumber("   ", "en")).toMatchObject({ status: "empty", value: null });
    expect(parseNumber("-", "en")).toMatchObject({ status: "incomplete", value: null });
    expect(parseNumber("+", "en")).toMatchObject({ status: "incomplete", value: null });
    expect(parseNumber(",", "it-IT")).toMatchObject({ status: "incomplete", value: null });
    expect(parseNumber("-,", "it-IT")).toMatchObject({ status: "incomplete", value: null });
    // A trailing separator already expresses a number.
    expect(parseNumber("12,", "it-IT")).toMatchObject({ status: "incomplete", value: 12 });
    expect(parseNumber(",5", "it-IT")).toMatchObject({ status: "valid", value: 0.5 });
  });

  it("rejects malformed input with a parse error", () => {
    for (const bad of ["abc", "1-2", "--5", "1e5", "0x10", "1.2.3"]) {
      expect(parseNumber(bad, "en"), bad).toMatchObject({
        status: "invalid",
        value: null,
        error: "parse",
      });
    }
    // In it-IT "1,2,3" carries two decimal separators.
    expect(parseNumber("1,2,3", "it-IT")).toMatchObject({ status: "invalid", error: "parse" });
  });

  it("normalizes -0 to 0 and rejects values beyond double range", () => {
    expect(Object.is(parseNumber("-0", "en").value, 0)).toBe(true);
    expect(Object.is(parseNumber("-0.0", "en").value, 0)).toBe(true);
    expect(parseNumber("9".repeat(400), "en")).toMatchObject({ status: "invalid", error: "parse" });
  });

  it("round-trips every formatted value back to the same number", () => {
    const values = [0, 1, -1, 0.5, 1234.5, -9876543.21, 15, 1000000];
    for (const locale of ["en", "it-IT", "de-DE", "ar-EG", "fr-FR"]) {
      for (const value of values) {
        const text = formatNumber(value, locale);
        expect(parseNumber(text, locale), `${locale} ${text}`).toMatchObject({
          status: "valid",
          value,
        });
      }
    }
  });
});

describe("number-field validation and stepping", () => {
  it("reports range and step violations without correcting them", () => {
    expect(validate(5, 10, null, 1)).toBe("range-underflow");
    expect(validate(50, null, 10, 1)).toBe("range-overflow");
    expect(validate(0.3, null, null, 0.1)).toBeNull();
    expect(validate(0.35, null, null, 0.1)).toBe("step-mismatch");
    // The step grid starts at min when min is set.
    expect(validate(2.5, 0.5, null, 1)).toBeNull();
    expect(validate(2, 0.5, null, 1)).toBe("step-mismatch");
  });

  it("steps decimal values without float drift", () => {
    let value = 0;
    for (let i = 0; i < 10; i++) value = snapToStep(value, 1, null, null, 0.1);
    expect(value).toBe(1);
    expect(snapToStep(0.3, 1, null, null, 0.1)).toBe(0.4);
    expect(snapToStep(1.005, 1, null, null, 0.005)).toBe(1.01);
  });

  it("snaps an off-grid value to the nearest multiple in the pressed direction", () => {
    expect(snapToStep(0.34, 1, null, null, 0.1)).toBe(0.4);
    expect(snapToStep(0.34, -1, null, null, 0.1)).toBe(0.3);
    expect(snapToStep(7, 1, 0.5, null, 1)).toBe(7.5);
  });

  it("clamps spin results inside the bounds", () => {
    expect(snapToStep(9.8, 1, 0, 10, 0.5)).toBe(10);
    expect(snapToStep(10, 1, 0, 10, 0.5)).toBe(10);
    expect(snapToStep(0.2, -1, 0, 10, 0.5)).toBe(0);
  });

  it("starts from the nearest bound when the field is empty", () => {
    expect(snapToStep(null, 1, 5, 10, 1)).toBe(5);
    expect(snapToStep(null, -1, 5, 10, 1)).toBe(10);
    expect(snapToStep(null, 1, null, null, 1)).toBe(0);
    expect(snapToStep(null, 1, null, -10, 1)).toBe(-10);
  });

  it("counts decimals through e-notation", () => {
    expect(decimalsOf(0.005)).toBe(3);
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(1e-7)).toBe(7);
  });

  it("formats without precision loss and emits a canonical ASCII form value", () => {
    expect(formatNumber(0.12345, "en")).toBe("0.12345");
    // it-IT only groups from five integer digits (CLDR minimumGroupingDigits).
    expect(formatNumber(1234.5, "it-IT")).toBe("1234,5");
    expect(formatNumber(12345.5, "it-IT")).toBe("12.345,5");
    expect(formatNumber(null, "en")).toBe("");
    expect(canonicalString(null)).toBe("");
    expect(canonicalString(1234.5)).toBe("1234.5");
    expect(canonicalString(1e21)).toBe("1000000000000000000000");
  });

  it("resolves defaults and sanitizes an invalid step", () => {
    const state = initialState({ value: 12345.5, locale: "it-IT", step: 0 });
    expect(state.step).toBe(1);
    expect(state.inputValue).toBe("12.345,5");
    expect(state.committedValue).toBe(12345.5);
    expect(state.id).toMatch(/^ds-number-field-/);
    expect(initialState({}).value).toBeNull();
  });
});

interface KeyResult {
  prevented: boolean;
  stopped: boolean;
}

function harness(context: NumberFieldContext = {}) {
  let state = initialState(context);
  const changes: (number | null)[] = [];
  const commits: (number | null)[] = [];
  let focusCalls = 0;
  const api = () =>
    connect({
      state,
      setInputValue: (text) => {
        state = { ...state, inputValue: text };
      },
      setValue: (value) => {
        state = { ...state, value };
        changes.push(value);
      },
      commitValue: (value) => {
        state = { ...state, committedValue: value };
        commits.push(value);
      },
      focus: () => {
        focusCalls += 1;
      },
    });
  return {
    api,
    changes,
    commits,
    focusCalls: () => focusCalls,
    text: () => state.inputValue,
    value: () => state.value,
    type: (text: string) => api().setDraft(text),
    blur: () => (api().inputProps.onBlur as () => void)(),
    key: (key: string): KeyResult => {
      const result: KeyResult = { prevented: false, stopped: false };
      (api().inputProps.onKeyDown as (e: Event) => void)({
        key,
        preventDefault: () => {
          result.prevented = true;
        },
        stopPropagation: () => {
          result.stopped = true;
        },
      } as unknown as Event);
      return result;
    },
    wheel: (deltaY: number, focused: boolean): boolean => {
      let prevented = false;
      const target = {} as { ownerDocument: { activeElement: unknown } };
      target.ownerDocument = { activeElement: focused ? target : null };
      (api().inputProps.onWheel as (e: Event) => void)({
        deltaY,
        currentTarget: target,
        preventDefault: () => {
          prevented = true;
        },
      } as unknown as Event);
      return prevented;
    },
  };
}

describe("number-field connect", () => {
  it("lets the canonical value follow the draft, one change per edit", () => {
    const h = harness({ step: 0.5 });
    h.type("12");
    expect(h.changes).toEqual([12]);
    h.type("12.");
    // Still the same number: no extra callback.
    expect(h.changes).toEqual([12]);
    expect(h.api().status).toBe("incomplete");
    h.type("12.5");
    expect(h.changes).toEqual([12, 12.5]);
    expect(h.api().status).toBe("valid");
    expect(h.commits).toEqual([]);
  });

  it("flags decimals against the default whole step, like the native input", () => {
    const h = harness();
    h.type("1.5");
    expect(h.api().validationError).toBe("step-mismatch");
  });

  it("commits once on blur and stays silent on a repeat blur", () => {
    const h = harness({ step: 0.5 });
    h.type("12.5");
    h.blur();
    expect(h.commits).toEqual([12.5]);
    expect(h.text()).toBe("12.5");
    h.blur();
    expect(h.commits).toEqual([12.5]);
    expect(h.changes).toEqual([12.5]);
  });

  it("reformats the display at commit in the field's locale", () => {
    const h = harness({ locale: "it-IT", step: 0.5 });
    h.type("12345,5");
    expect(h.value()).toBe(12345.5);
    h.blur();
    expect(h.text()).toBe("12.345,5");
    expect(h.commits).toEqual([12345.5]);
    // The grouped text still reads as the same number afterwards.
    expect(h.api().status).toBe("valid");
  });

  it("commits null when the field is emptied", () => {
    const h = harness({ value: 5 });
    h.type("");
    expect(h.changes).toEqual([null]);
    h.blur();
    expect(h.commits).toEqual([null]);
    expect(h.text()).toBe("");
  });

  it("keeps an unparseable draft as typed and never commits it", () => {
    const h = harness({ value: 5 });
    h.type("1..2");
    expect(h.changes).toEqual([null]);
    expect(h.api().status).toBe("invalid");
    expect(h.api().validationError).toBe("parse");
    h.blur();
    expect(h.text()).toBe("1..2");
    expect(h.commits).toEqual([]);
    expect(h.api().inputProps["aria-invalid"]).toBe(true);
    expect(h.api().inputProps["data-invalid"]).toBe("");
  });

  it("reports a typed out-of-range value instead of clamping it", () => {
    const h = harness({ max: 10 });
    h.type("999");
    expect(h.changes).toEqual([999]);
    expect(h.api().validationError).toBe("range-overflow");
    expect(h.api().inputProps["aria-invalid"]).toBe(true);
    expect(h.api().inputProps["aria-valuenow"]).toBe(999);
    h.blur();
    expect(h.commits).toEqual([999]);
  });

  it("reports a typed step mismatch", () => {
    const h = harness({ step: 0.5 });
    h.type("1.3");
    expect(h.api().validationError).toBe("step-mismatch");
    expect(h.changes).toEqual([1.3]);
  });

  it("steps with the arrow keys and treats each spin as a commit", () => {
    const h = harness({ value: 2, step: 0.5 });
    expect(h.key("ArrowUp").prevented).toBe(true);
    expect(h.value()).toBe(2.5);
    expect(h.changes).toEqual([2.5]);
    expect(h.commits).toEqual([2.5]);
    h.key("ArrowDown");
    expect(h.value()).toBe(2);
    expect(h.commits).toEqual([2.5, 2]);
  });

  it("spins from the draft and snaps an off-grid draft to the grid", () => {
    const h = harness({ step: 0.1 });
    h.type("0.34");
    h.key("ArrowUp");
    expect(h.value()).toBe(0.4);
    expect(h.text()).toBe("0.4");
  });

  it("stops at the bounds and disables the matching spin button", () => {
    const h = harness({ value: 10, min: 0, max: 10 });
    expect(h.api().canIncrement).toBe(false);
    expect(h.api().incrementProps.disabled).toBe(true);
    h.key("ArrowUp");
    expect(h.changes).toEqual([]);
    expect(h.commits).toEqual([]);
    h.key("ArrowDown");
    expect(h.value()).toBe(9);
  });

  it("jumps to the bounds with Home and End only when both exist", () => {
    const bounded = harness({ value: 5, min: 0, max: 10 });
    expect(bounded.key("Home").prevented).toBe(true);
    expect(bounded.value()).toBe(0);
    expect(bounded.key("End").prevented).toBe(true);
    expect(bounded.value()).toBe(10);
    expect(bounded.commits).toEqual([0, 10]);
    const open = harness({ value: 5, min: 0 });
    // Without both bounds the keys keep their native caret meaning.
    expect(open.key("Home").prevented).toBe(false);
    expect(open.value()).toBe(5);
  });

  it("commits on Enter without blocking form submission", () => {
    const h = harness();
    h.type("7");
    const result = h.key("Enter");
    expect(result.prevented).toBe(false);
    expect(h.commits).toEqual([7]);
  });

  it("reverts the draft on Escape and passes Escape through when clean", () => {
    const h = harness({ value: 5 });
    h.type("99");
    expect(h.changes).toEqual([99]);
    const dirty = h.key("Escape");
    expect(dirty.stopped).toBe(true);
    expect(h.text()).toBe("5");
    expect(h.value()).toBe(5);
    expect(h.commits).toEqual([]);
    const clean = h.key("Escape");
    expect(clean.stopped).toBe(false);
  });

  it("ignores editing and stepping when disabled or read-only", () => {
    const disabled = harness({ value: 5, disabled: true });
    disabled.type("9");
    disabled.key("ArrowUp");
    expect(disabled.changes).toEqual([]);
    expect(disabled.api().inputProps.disabled).toBe(true);
    const readOnly = harness({ value: 5, readOnly: true });
    readOnly.type("9");
    // Read-only arrows keep their native caret meaning.
    expect(readOnly.key("ArrowUp").prevented).toBe(false);
    expect(readOnly.changes).toEqual([]);
    expect(readOnly.api().incrementProps.disabled).toBe(true);
  });

  it("keeps the wheel inert unless opted in, focused, and hovered", () => {
    const off = harness({ value: 5 });
    expect(off.wheel(-1, true)).toBe(false);
    expect(off.changes).toEqual([]);
    const on = harness({ value: 5, changeOnWheel: true });
    expect(on.wheel(-1, false)).toBe(false);
    expect(on.changes).toEqual([]);
    expect(on.wheel(-1, true)).toBe(true);
    expect(on.value()).toBe(6);
    expect(on.commits).toEqual([6]);
    expect(on.wheel(1, true)).toBe(true);
    expect(on.value()).toBe(5);
    // A horizontal-only gesture keeps scrolling the page.
    expect(on.wheel(0, true)).toBe(false);
    expect(on.value()).toBe(5);
  });

  it("exposes truthful spinbutton semantics on the input", () => {
    const h = harness({
      value: 12345.5,
      locale: "it-IT",
      min: 0,
      max: 100000,
      step: 0.5,
      required: true,
    });
    const props = h.api().inputProps;
    expect(props.role).toBe("spinbutton");
    expect(props.type).toBe("text");
    expect(props.inputmode).toBe("decimal");
    expect(props["aria-valuemin"]).toBe(0);
    expect(props["aria-valuemax"]).toBe(100000);
    expect(props["aria-valuenow"]).toBe(12345.5);
    expect(props["aria-valuetext"]).toBe("12.345,5");
    expect(props["aria-required"]).toBe(true);
    expect(props.required).toBe(true);
    expect(props["data-state"]).toBe("valid");
    const empty = harness().api().inputProps;
    expect(empty["aria-valuenow"]).toBeUndefined();
    expect(empty["aria-valuetext"]).toBeUndefined();
    expect(empty["data-state"]).toBe("empty");
  });

  it("links the label and names the spin buttons off the tab order", () => {
    const h = harness({ id: "nf" });
    const api = connect({
      state: initialState({ id: "nf" }),
      setInputValue: () => {},
      setValue: () => {},
      commitValue: () => {},
      messages: { increment: "Increase Price", decrement: "Decrease Price" },
    });
    expect(h.api().labelProps.for).toBe("nf-input");
    expect(api.incrementProps["aria-label"]).toBe("Increase Price");
    expect(api.decrementProps["aria-label"]).toBe("Decrease Price");
    expect(api.incrementProps.tabindex).toBe(-1);
    expect(api.incrementProps.type).toBe("button");
    expect(api.incrementProps["aria-controls"]).toBe("nf-input");
  });

  it("keeps focus on the input when a spin button is pressed", () => {
    const h = harness({ value: 1 });
    let prevented = false;
    (h.api().incrementProps.onPointerDown as (e: Event) => void)({
      preventDefault: () => {
        prevented = true;
      },
    } as unknown as Event);
    expect(prevented).toBe(true);
    expect(h.focusCalls()).toBe(1);
    (h.api().incrementProps.onClick as () => void)();
    expect(h.value()).toBe(2);
  });

  it("carries the canonical ASCII value on the hidden input across locales", () => {
    const h = harness({ locale: "ar-EG" });
    h.type("١٥٫٥");
    expect(h.value()).toBe(15.5);
    expect(h.api().formValue).toBe("15.5");
    expect(h.api().hiddenInputProps.value).toBe("15.5");
    expect(h.api().hiddenInputProps.type).toBe("hidden");
    const disabled = harness({ value: 3, disabled: true });
    expect(disabled.api().hiddenInputProps.disabled).toBe(true);
  });
});
