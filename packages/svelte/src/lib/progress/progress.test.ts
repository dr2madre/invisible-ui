import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./progress.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Progress", () => {
  it("exposes the progressbar role with ARIA value for a determinate bar", () => {
    render(Fixture, { props: { value: 40 } });
    const bar = screen.getByRole("progressbar", { name: "Upload progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("data-state", "loading");
  });

  it("marks completion at the maximum", () => {
    render(Fixture, { props: { value: 100 } });
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-state", "complete");
  });

  it("omits aria-valuenow when indeterminate", () => {
    render(Fixture, { props: { value: null } });
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar).toHaveAttribute("data-state", "indeterminate");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: 60 } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
