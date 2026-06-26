import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./scroll-area.fixture.svelte";

const viewport = () => document.querySelector<HTMLElement>(".scroll-area__viewport")!;

describe("Svelte ScrollArea (styled)", () => {
  it("renders the content in a keyboard-focusable viewport", () => {
    render(Fixture);
    expect(screen.getByText("Line one of scrollable content.")).toBeInTheDocument();
    // The viewport is focusable so keyboard users can scroll it.
    expect(viewport()).toHaveAttribute("tabindex", "0");
  });

  it("reflects the orientation on the root", () => {
    render(Fixture, { props: { orientation: "both" } });
    expect(document.querySelector(".scroll-area")).toHaveAttribute("data-orientation", "both");
  });

  it("becomes a labelled scroll region when given a label", () => {
    render(Fixture, { props: { label: "Logs" } });
    expect(screen.getByRole("region", { name: "Logs" })).toBe(viewport());
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { label: "Logs" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
