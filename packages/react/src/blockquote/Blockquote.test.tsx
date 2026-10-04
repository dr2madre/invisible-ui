import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Blockquote } from "./Blockquote";

describe("React Blockquote", () => {
  it("renders the quoted text in a <blockquote>", () => {
    const { container } = render(<Blockquote>Simplicity is prerequisite.</Blockquote>);
    expect(container.querySelector("figure.blockquote blockquote")).toHaveTextContent(
      "Simplicity is prerequisite.",
    );
  });

  it("renders no attribution by default", () => {
    const { container } = render(<Blockquote>Quote</Blockquote>);
    expect(container.querySelector("figcaption")).toBeNull();
  });

  it("shows the attribution when cite is given, as text or markup", () => {
    const { container, rerender } = render(<Blockquote cite="Edsger Dijkstra">Quote</Blockquote>);
    expect(container.querySelector("figcaption.blockquote__cite")).toHaveTextContent(
      "Edsger Dijkstra",
    );
    rerender(<Blockquote cite={<cite>EWD 1036</cite>}>Quote</Blockquote>);
    expect(container.querySelector("figcaption cite")).toHaveTextContent("EWD 1036");
  });

  it("maps citeUrl to the native cite attribute", () => {
    const { container } = render(
      <Blockquote citeUrl="https://example.com/source">Quote</Blockquote>,
    );
    expect(container.querySelector("blockquote")).toHaveAttribute(
      "cite",
      "https://example.com/source",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Blockquote cite="Edsger Dijkstra">Quote</Blockquote>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
