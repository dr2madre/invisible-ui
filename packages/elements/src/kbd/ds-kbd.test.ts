import { axe } from "vitest-axe";
import "../define";
import type { DsKbd } from "./ds-kbd";

const mount = (markup: string) => {
  document.body.innerHTML = markup;
  return document.querySelector("ds-kbd") as DsKbd;
};

describe("<ds-kbd>", () => {
  it("renders a single key in a <kbd>", () => {
    mount(`<ds-kbd>Esc</ds-kbd>`);
    const kbd = document.querySelector<HTMLElement>("kbd.kbd")!;
    expect(kbd).toHaveTextContent("Esc");
    expect(kbd.tagName).toBe("KBD");
    expect(kbd).toHaveClass("kbd__key");
  });

  it("renders a chord as nested keycaps joined by a hidden separator", () => {
    mount(`<ds-kbd keys="⌘ K"></ds-kbd>`);
    expect(document.querySelector(".kbd")).toHaveClass("kbd--chord");
    expect(document.querySelectorAll(".kbd__key")).toHaveLength(2);
    const sep = document.querySelector(".kbd__sep")!;
    expect(sep).toHaveTextContent("+");
    expect(sep).toHaveAttribute("aria-hidden", "true");
  });

  it("honours a custom separator", () => {
    mount(`<ds-kbd keys="Ctrl Alt Del" separator="·"></ds-kbd>`);
    const seps = document.querySelectorAll(".kbd__sep");
    expect(seps).toHaveLength(2);
    expect(seps[0]).toHaveTextContent("·");
  });

  it("takes key names with spaces through the keys property", () => {
    const host = mount(`<ds-kbd>Esc</ds-kbd>`);
    host.keys = ["Shift", "Page Up"];
    const caps = document.querySelectorAll(".kbd__key");
    expect(caps).toHaveLength(2);
    expect(caps[1]).toHaveTextContent("Page Up");

    host.keys = [];
    expect(document.querySelector(".kbd")).toHaveTextContent("Esc");
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-kbd keys="⌘ K"></ds-kbd>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
