import { describe, expect, it, vi } from "vitest";
import { connect } from "./connect";
import { initialState } from "./state";

describe("button state", () => {
  it("defaults to a not-disabled default-variant button", () => {
    expect(initialState()).toEqual({ disabled: false, variant: "default" });
  });

  it("honours initial context", () => {
    expect(initialState({ disabled: true, variant: "danger" })).toEqual({
      disabled: true,
      variant: "danger",
    });
  });
});

describe("button connect (native)", () => {
  it("defaults to type=button to avoid accidental submits", () => {
    const api = connect({ state: initialState() });
    expect(api.rootProps.type).toBe("button");
    expect(api.rootProps.disabled).toBeUndefined();
    expect(api.rootProps["data-disabled"]).toBeUndefined();
  });

  it("respects an explicit type", () => {
    const api = connect({ state: initialState(), type: "submit" });
    expect(api.rootProps.type).toBe("submit");
  });

  it("marks the disabled state", () => {
    const api = connect({ state: initialState({ disabled: true }) });
    expect(api.rootProps.disabled).toBe(true);
    expect(api.rootProps["data-disabled"]).toBe("");
  });

  it("exposes the semantic variant as data-variant", () => {
    expect(connect({ state: initialState() }).rootProps["data-variant"]).toBe("default");
    expect(connect({ state: initialState({ variant: "primary" }) }).variant).toBe("primary");
    expect(connect({ state: initialState({ variant: "secondary" }) }).variant).toBe("secondary");
    expect(connect({ state: initialState({ variant: "ghost" }) }).variant).toBe("ghost");
    expect(connect({ state: initialState({ variant: "danger" }) }).rootProps["data-variant"]).toBe(
      "danger",
    );
  });

  it("calls onPress on click", () => {
    const onPress = vi.fn();
    const api = connect({ state: initialState(), onPress });
    (api.rootProps.onClick as (e: Event) => void)(new Event("click"));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("does not call onPress when disabled", () => {
    const onPress = vi.fn();
    const api = connect({ state: initialState({ disabled: true }), onPress });
    (api.rootProps.onClick as (e: Event) => void)(new Event("click"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("button connect (non-native)", () => {
  it("emulates button role and focusability", () => {
    const api = connect({ state: initialState(), nativeButton: false });
    expect(api.rootProps.role).toBe("button");
    expect(api.rootProps.tabindex).toBe(0);
    expect(api.rootProps["aria-disabled"]).toBeUndefined();
    expect(api.rootProps["data-variant"]).toBe("default");
  });

  it("removes focusability and sets aria-disabled when disabled", () => {
    const api = connect({ state: initialState({ disabled: true }), nativeButton: false });
    expect(api.rootProps.tabindex).toBeUndefined();
    expect(api.rootProps["aria-disabled"]).toBe(true);
  });

  // Core stays DOM-free, so tests use a minimal stub of what connect reads.
  const keyEvent = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as Event;

  it("activates on Enter and Space", () => {
    const onPress = vi.fn();
    const api = connect({ state: initialState(), nativeButton: false, onPress });
    const onKeyDown = api.rootProps.onKeyDown as (e: Event) => void;

    onKeyDown(keyEvent("Enter"));
    onKeyDown(keyEvent(" "));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("ignores other keys", () => {
    const onPress = vi.fn();
    const api = connect({ state: initialState(), nativeButton: false, onPress });
    (api.rootProps.onKeyDown as (e: Event) => void)(keyEvent("a"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
