import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Kbd } from "./Kbd";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Vue Kbd", () => {
  it("renders a single key in a <kbd>", () => {
    render(Kbd, { slots: { default: "Esc" } });
    const kbd = document.querySelector<HTMLElement>("kbd.kbd")!;
    expect(kbd).toHaveTextContent("Esc");
    expect(kbd.tagName).toBe("KBD");
  });

  it("renders a chord as nested keycaps joined by the separator", () => {
    render(Kbd, { props: { keys: ["⌘", "K"] } });
    expect(document.querySelectorAll(".kbd__key")).toHaveLength(2);
    expect(document.querySelector(".kbd__sep")).toHaveTextContent("+");
  });

  it("honors a custom separator", () => {
    render(Kbd, { props: { keys: ["Ctrl", "Alt", "Del"], separator: "·" } });
    const seps = document.querySelectorAll(".kbd__sep");
    expect(seps).toHaveLength(2);
    expect(seps[0]).toHaveTextContent("·");
  });

  it("falls back to the slot when the chord is empty", () => {
    render(Kbd, { props: { keys: [] }, slots: { default: "Esc" } });
    expect(document.querySelector(".kbd__sep")).toBeNull();
    expect(document.querySelector("kbd.kbd")).toHaveTextContent("Esc");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Kbd, { props: { keys: ["⌘", "K"] } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
