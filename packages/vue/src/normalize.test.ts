import { describe, expect, it, vi } from "vitest";
import { normalizeProps } from "./normalize";

describe("normalizeProps (the Vue seam)", () => {
  it("passes ARIA, data and role attributes through untouched", () => {
    const out = normalizeProps({
      role: "switch",
      "aria-disabled": true,
      "data-state": "checked",
      type: "checkbox",
    });

    expect(out).toEqual({
      role: "switch",
      "aria-disabled": true,
      "data-state": "checked",
      type: "checkbox",
    });
  });

  it("passes single-word handlers through as vnode props", () => {
    const onClick = vi.fn();
    const onChange = vi.fn();
    const out = normalizeProps({ onClick, onChange });

    expect(out.onClick).toBe(onClick);
    expect(out.onChange).toBe(onChange);
  });

  it("collapses multi-word handler keys so Vue resolves the DOM event name", () => {
    const onKeyDown = vi.fn();
    const onMouseEnter = vi.fn();
    const out = normalizeProps({ onKeyDown, onMouseEnter });

    // Vue hyphenates what follows `on`; `onKeyDown` would listen for
    // "key-down", while `onKeydown` resolves to "keydown".
    expect(out.onKeydown).toBe(onKeyDown);
    expect(out.onMouseenter).toBe(onMouseEnter);
    expect("onKeyDown" in out).toBe(false);
  });

  it("keeps DOM attribute spellings, which Vue accepts as-is", () => {
    const out = normalizeProps({ tabindex: 0, for: "field", class: "x", readonly: true });

    expect(out).toEqual({ tabindex: 0, for: "field", class: "x", readonly: true });
  });

  it("drops undefined so the vnode carries no dead keys", () => {
    const out = normalizeProps({ disabled: undefined, "data-disabled": undefined, type: "button" });

    expect(out).toEqual({ type: "button" });
    expect("disabled" in out).toBe(false);
  });

  it("keeps falsy values that are not undefined", () => {
    const out = normalizeProps({ tabindex: 0, disabled: false, "data-disabled": "" });

    expect(out).toEqual({ tabindex: 0, disabled: false, "data-disabled": "" });
  });
});
