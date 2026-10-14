// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { pageLocale, subscribePageLocale } from "./locale";

describe("pageLocale", () => {
  const root = document.documentElement;
  afterEach(() => {
    document.body.replaceChildren();
    root.removeAttribute("lang");
    root.removeAttribute("dir");
  });

  it("reads nothing from a page that declares nothing", () => {
    expect(pageLocale()).toEqual({ locale: null, dir: null });
  });

  it("reads the document element, then the closest attributes", () => {
    root.setAttribute("lang", "ar-EG");
    root.setAttribute("dir", "rtl");
    const section = document.createElement("section");
    section.setAttribute("lang", "it");
    const leaf = document.createElement("span");
    section.append(leaf);
    document.body.append(section);
    expect(pageLocale()).toEqual({ locale: "ar-EG", dir: "rtl" });
    expect(pageLocale(leaf)).toEqual({ locale: "it", dir: "rtl" });
    section.setAttribute("dir", "ltr");
    expect(pageLocale(leaf).dir).toBe("ltr");
    // A value other than ltr or rtl leaves the direction to the ancestors.
    section.setAttribute("dir", "sideways");
    expect(pageLocale(leaf).dir).toBe("rtl");
    // An empty `lang` declares an unknown language.
    section.setAttribute("lang", "");
    expect(pageLocale(leaf).locale).toBeNull();
  });

  it("reads a direction set on the body, which a closer one overrides", () => {
    document.body.setAttribute("dir", "rtl");
    expect(pageLocale().dir).toBe("rtl");
    root.setAttribute("dir", "ltr");
    expect(pageLocale().dir).toBe("rtl");
    document.body.removeAttribute("dir");
    expect(pageLocale().dir).toBe("ltr");
  });
});

describe("subscribePageLocale", () => {
  it("reports changes to the document element's lang and dir until stopped", async () => {
    const root = document.documentElement;
    let calls = 0;
    const stop = subscribePageLocale(() => calls++);
    root.setAttribute("lang", "it");
    await Promise.resolve();
    expect(calls).toBe(1);
    root.setAttribute("dir", "rtl");
    root.setAttribute("class", "unrelated");
    await Promise.resolve();
    expect(calls).toBe(2);
    document.body.setAttribute("dir", "rtl");
    await Promise.resolve();
    expect(calls).toBe(3);
    document.body.removeAttribute("dir");
    await Promise.resolve();
    expect(calls).toBe(4);
    stop();
    root.setAttribute("lang", "de");
    await Promise.resolve();
    expect(calls).toBe(4);
    root.removeAttribute("lang");
    root.removeAttribute("dir");
    root.removeAttribute("class");
  });
});
