import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./dot-grid.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte DotGrid", () => {
  it("is a polite status with a default accessible name", () => {
    render(Fixture);
    expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument();
  });

  it("uses a provided label", () => {
    render(Fixture, { props: { label: "Generating image" } });
    expect(screen.getByRole("status", { name: "Generating image" })).toBeInTheDocument();
  });

  it("is hidden from assistive tech when decorative", () => {
    render(Fixture, { props: { decorative: true } });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
