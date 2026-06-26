import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./blockquote.fixture.svelte";

const quote = () => document.querySelector<HTMLElement>("blockquote.blockquote__quote")!;

describe("Blockquote", () => {
  it("renders the quoted text in a <blockquote>", () => {
    render(Fixture);
    expect(quote()).toHaveTextContent("Simplicity is the ultimate sophistication.");
  });

  it("renders no attribution caption by default", () => {
    render(Fixture);
    expect(document.querySelector(".blockquote__cite")).toBeNull();
  });

  it("shows the attribution when cite is given", () => {
    render(Fixture, { props: { cite: "Leonardo da Vinci" } });
    expect(document.querySelector(".blockquote__cite")).toHaveTextContent("Leonardo da Vinci");
  });

  it("maps citeUrl to the native cite attribute", () => {
    render(Fixture, { props: { citeUrl: "https://example.com/source" } });
    expect(quote()).toHaveAttribute("cite", "https://example.com/source");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { cite: "Leonardo da Vinci" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
