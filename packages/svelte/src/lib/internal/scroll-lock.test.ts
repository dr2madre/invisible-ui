import { afterEach, describe, expect, it } from "vitest";
import { lockScroll } from "./scroll-lock";
// The same file under a different specifier: a second copy of the module, the
// way two adapters or two installed versions would each load their own.
import { lockScroll as lockScrollElsewhere } from "./scroll-lock?copy";

// Two overlays can be open at once, and they do not close in the order they
// opened. Each of these cases used to leave the page unscrollable for good, or
// let it scroll behind a modal that was still open.

/** Stage a scrollbar of a given width: overlay scrollbars take no room. */
const withScrollbar = (width: number) => {
  Object.defineProperty(document.documentElement, "clientWidth", {
    value: window.innerWidth - width,
    configurable: true,
  });
};

afterEach(() => {
  Reflect.deleteProperty(document.documentElement, "clientWidth");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  // The count lives on the body, so a test that fails mid-lock must not leave
  // it there for the next one.
  delete document.body.dataset.dsScrollLocks;
  delete document.body.dataset.dsScrollLockPrevious;
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
    // Nothing here has a scrollbar on its own, and a page without one pads by
    // nothing: the width has to be staged, or the assertions compare "" to "".
    withScrollbar(15);
    document.body.style.paddingRight = "8px";

    const first = lockScroll();
    expect(document.body.style.paddingRight, "the page keeps its own padding").toBe("23px");
    const second = lockScroll();
    expect(document.body.style.paddingRight, "the second overlay must not pad again").toBe("23px");
    second();
    first();
    expect(document.body.style.paddingRight, "and the page gets its padding back").toBe("8px");
  });

  it("pads by nothing when the scrollbar takes no room", () => {
    withScrollbar(0);
    const release = lockScroll();
    expect(document.body.style.paddingRight).toBe("");
    release();
  });

  it("counts locks taken by another copy of this module", () => {
    // Two adapters in one app, or two installed copies of one package, each
    // load their own module: the count has to be shared or the page stays
    // locked when the first one lets go.
    const first = lockScroll();
    const second = lockScrollElsewhere();
    first();
    expect(document.body.style.overflow, "the other copy still holds one").toBe("hidden");
    second();
    expect(document.body.style.overflow).toBe("");
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
