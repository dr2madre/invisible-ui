import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Kbd } from "./Kbd";

describe("React Kbd", () => {
  it("renders a single key in a <kbd>", () => {
    const { container } = render(<Kbd>Esc</Kbd>);
    const key = container.querySelector("kbd")!;
    expect(key).toHaveClass("kbd", "kbd__key");
    expect(key).toHaveTextContent("Esc");
  });

  it("renders a chord as nested keycaps joined by a hidden separator", () => {
    const { container } = render(<Kbd keys={["⌘", "K"]} />);
    const chord = container.querySelector("kbd.kbd--chord")!;
    expect(chord.querySelectorAll("kbd.kbd__key")).toHaveLength(2);
    const separator = chord.querySelector(".kbd__sep")!;
    expect(separator).toHaveTextContent("+");
    expect(separator).toHaveAttribute("aria-hidden", "true");
  });

  it("honours a custom separator and a repeated key", () => {
    const { container } = render(<Kbd keys={["G", "G"]} separator="then" />);
    expect(container.querySelectorAll("kbd.kbd__key")).toHaveLength(2);
    expect(container.querySelector(".kbd__sep")).toHaveTextContent("then");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Kbd keys={["Ctrl", "S"]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
