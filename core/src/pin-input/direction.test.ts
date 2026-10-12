// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";

/** Press `key` on a real cell inside `markup`, and return where focus went. */
function press(markup: string, key: string, index = 1) {
  document.body.innerHTML = markup;
  const cell = document.querySelector("input")!;
  const focus = vi.fn();
  const api = connect({ state: initialState({ length: 4, id: "x" }), setValues: () => {}, focus });
  const handler = api.getInputProps(index).onKeyDown as (e: Event) => void;
  cell.addEventListener("keydown", handler);
  cell.dispatchEvent(new KeyboardEvent("keydown", { key, cancelable: true }));
  cell.removeEventListener("keydown", handler);
  return focus.mock.calls[0]?.[0] as number | undefined;
}

describe("pin-input reading direction", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reads the direction from the layout when none is given", () => {
    expect(press(`<div dir="rtl"><input /></div>`, "ArrowLeft")).toBe(2);
    expect(press(`<div dir="rtl"><input /></div>`, "ArrowRight")).toBe(0);
    expect(press(`<div><input /></div>`, "ArrowLeft")).toBe(0);
    expect(press(`<div><input /></div>`, "ArrowRight")).toBe(2);
  });

  it("follows an explicit direction over the layout", () => {
    document.body.innerHTML = `<div><input /></div>`;
    const cell = document.querySelector("input")!;
    const focus = vi.fn();
    const api = connect({
      state: initialState({ length: 4, id: "x" }),
      setValues: () => {},
      focus,
      direction: "rtl",
    });
    cell.addEventListener("keydown", api.getInputProps(1).onKeyDown as (e: Event) => void);
    cell.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(focus).toHaveBeenCalledWith(2);
  });
});
