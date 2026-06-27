import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./kbd.fixture.svelte";

describe("Kbd", () => {
  it("renders a single key in a <kbd>", () => {
    render(Fixture);
    const kbd = document.querySelector<HTMLElement>("kbd.kbd")!;
    expect(kbd).toHaveTextContent("Esc");
    expect(kbd.tagName).toBe("KBD");
  });

  it("renders a chord as nested keycaps joined by the separator", () => {
    render(Fixture, { props: { keys: ["⌘", "K"] } });
    const caps = document.querySelectorAll(".kbd__key");
    expect(caps).toHaveLength(2);
    expect(document.querySelector(".kbd__sep")).toHaveTextContent("+");
  });

  it("honors a custom separator", () => {
    render(Fixture, { props: { keys: ["Ctrl", "Alt", "Del"], separator: "·" } });
    const seps = document.querySelectorAll(".kbd__sep");
    expect(seps).toHaveLength(2);
    expect(seps[0]).toHaveTextContent("·");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { keys: ["⌘", "K"] } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
