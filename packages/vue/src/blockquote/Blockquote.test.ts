import { render } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Blockquote } from "./Blockquote";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const slots = { default: () => "Simplicity is the ultimate sophistication." };

const quote = () => document.querySelector<HTMLElement>("blockquote.blockquote__quote")!;

describe("Vue Blockquote", () => {
  it("renders the quoted text in a <blockquote>", () => {
    render(Blockquote, { slots });
    expect(quote()).toHaveTextContent("Simplicity is the ultimate sophistication.");
  });

  it("renders no attribution caption by default", () => {
    render(Blockquote, { slots });
    expect(document.querySelector(".blockquote__cite")).toBeNull();
  });

  it("shows the attribution when cite is given", () => {
    render(Blockquote, { props: { cite: "Leonardo da Vinci" }, slots });
    expect(document.querySelector(".blockquote__cite")).toHaveTextContent("Leonardo da Vinci");
  });

  it("shows rich attribution content through the cite slot", () => {
    render(Blockquote, {
      slots: { ...slots, cite: () => "Leonardo da Vinci, Notebooks" },
    });
    expect(document.querySelector(".blockquote__cite")).toHaveTextContent(
      "Leonardo da Vinci, Notebooks",
    );
  });

  it("maps citeUrl to the native cite attribute", () => {
    render(Blockquote, { props: { citeUrl: "https://example.com/source" }, slots });
    expect(quote()).toHaveAttribute("cite", "https://example.com/source");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Blockquote, { props: { cite: "Leonardo da Vinci" }, slots });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
