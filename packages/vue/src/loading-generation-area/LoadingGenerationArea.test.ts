import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { LoadingGenerationArea } from "./LoadingGenerationArea";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const slots = { default: () => "Loaded content" };

describe("Vue LoadingGenerationArea", () => {
  it("is a polite status with a default accessible name", () => {
    render(LoadingGenerationArea, { slots });
    expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument();
  });

  it("uses a provided label", () => {
    render(LoadingGenerationArea, { props: { label: "Generating image" }, slots });
    expect(screen.getByRole("status", { name: "Generating image" })).toBeInTheDocument();
  });

  it("shows a live status, a percentage and a detail line", () => {
    render(LoadingGenerationArea, {
      props: { status: "Rendering…", value: 40, detail: "3 of 8 files" },
      slots,
    });
    expect(screen.getByText("Rendering…")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("3 of 8 files")).toBeInTheDocument();
  });

  it("places the label zone via labelPosition", () => {
    render(LoadingGenerationArea, {
      props: { labelPosition: "bottom", status: "Working…" },
      slots,
    });
    expect(screen.getByRole("status")).toHaveAttribute("data-position", "bottom");
  });

  it("is hidden from assistive tech when decorative", () => {
    render(LoadingGenerationArea, { props: { decorative: true }, slots });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the content in place of the placeholder when loading ends", async () => {
    const { rerender } = render(LoadingGenerationArea, { props: { loading: true }, slots });
    // While loading: the placeholder (status region), not the content.
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Loaded content")).not.toBeInTheDocument();
    // Done: the content replaces the placeholder.
    await rerender({ loading: false });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Loaded content")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(LoadingGenerationArea, {
      props: { status: "Loading data" },
      slots,
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
