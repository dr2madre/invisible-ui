import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./loading-generation-area.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte LoadingGenerationArea", () => {
  it("is a polite status with a default accessible name", () => {
    render(Fixture);
    expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument();
  });

  it("uses a provided label", () => {
    render(Fixture, { props: { label: "Generating image" } });
    expect(screen.getByRole("status", { name: "Generating image" })).toBeInTheDocument();
  });

  it("shows a live status, a percentage and a detail line", () => {
    render(Fixture, {
      props: { status: "Rendering…", value: 40, detail: "3 of 8 files" },
    });
    expect(screen.getByText("Rendering…")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("3 of 8 files")).toBeInTheDocument();
  });

  it("places the label zone via labelPosition", () => {
    render(Fixture, { props: { labelPosition: "bottom", status: "Working…" } });
    expect(screen.getByRole("status")).toHaveAttribute("data-position", "bottom");
  });

  it("is hidden from assistive tech when decorative", () => {
    render(Fixture, { props: { decorative: true } });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the content in place of the placeholder when loading ends", () => {
    const { rerender } = render(Fixture, { props: { loading: true } });
    // While loading: the placeholder (status region), not the content.
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Loaded content")).not.toBeInTheDocument();
    // Done: the content replaces the placeholder.
    rerender({ loading: false });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Loaded content")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { status: "Loading data" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
