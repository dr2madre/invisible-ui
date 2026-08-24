import { afterEach, describe, expect, it } from "vitest";
import { lockScroll } from "./scroll-lock";

// Two overlays can be open at once, and they do not close in the order they
// opened. Each of these cases used to leave the page unscrollable for good, or
// let it scroll behind a modal that was still open.

afterEach(() => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

describe("scroll lock", () => {
  it("holds and releases a single lock", () => {
    const release = lockScroll();
    expect(document.body.style.overflow).toBe("hidden");
    release();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps holding while a second overlay is open", () => {
    const first = lockScroll();
    const second = lockScroll();
    first();
    expect(document.body.style.overflow, "the second overlay is still open").toBe("hidden");
    second();
    expect(document.body.style.overflow).toBe("");
  });

  it("restores the page when the locks are released out of order", () => {
    const first = lockScroll();
    const second = lockScroll();
    second();
    first();
    expect(document.body.style.overflow).toBe("");
  });

  it("restores what was there before the first lock, not what the second saw", () => {
    document.body.style.overflow = "scroll";
    const first = lockScroll();
    const second = lockScroll();
    second();
    first();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("compensates for the scrollbar once, not once per overlay", () => {
    const first = lockScroll();
    const withOne = document.body.style.paddingRight;
    const second = lockScroll();
    expect(document.body.style.paddingRight, "the second overlay must not pad again").toBe(withOne);
    second();
    first();
    expect(document.body.style.paddingRight).toBe("");
  });

  it("ignores a cleanup called twice", () => {
    const first = lockScroll();
    const second = lockScroll();
    first();
    first();
    expect(document.body.style.overflow, "the second overlay still holds one lock").toBe("hidden");
    second();
    expect(document.body.style.overflow).toBe("");
  });
});
