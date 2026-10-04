import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Loading } from "../loading/Loading";
import { LoadingGenerationArea } from "./LoadingGenerationArea";

const area = () => document.querySelector<HTMLElement>(".loading-generation-area")!;

describe("React LoadingGenerationArea", () => {
  it("is a polite status with a default accessible name and the dot field", () => {
    render(<LoadingGenerationArea />);
    expect(screen.getByRole("status", { name: "Loading…" })).toBe(area());
    expect(area()).toHaveClass("loading-generation-area--field");
    expect(area()).toHaveAttribute("data-position", "center");
    expect(area().querySelector(".loading-generation-area__zone")).toBeNull();
  });

  it("uses a provided label", () => {
    render(<LoadingGenerationArea label="Generating image" />);
    expect(screen.getByRole("status", { name: "Generating image" })).toBeInTheDocument();
  });

  it("shows a live status, a percentage and a detail line", () => {
    render(<LoadingGenerationArea status="Rendering…" value={40} detail="3 of 8 files" />);
    expect(screen.getByText("Rendering…")).toBeInTheDocument();
    expect(screen.getByText("40%")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("3 of 8 files")).toHaveAttribute("aria-hidden", "true");
    // The status carries the announcement, in full.
    expect(area()).toHaveAttribute("aria-atomic", "true");
    expect(area()).not.toHaveAttribute("aria-label");
  });

  it("places the label zone via labelPosition", () => {
    render(<LoadingGenerationArea labelPosition="bottom" status="Working…" />);
    expect(screen.getByRole("status")).toHaveAttribute("data-position", "bottom");
  });

  it("drops the dot field and shows another loader as the indicator", () => {
    render(
      <LoadingGenerationArea field={false} indicator={<Loading variant="spinner" decorative />} />,
    );
    expect(area()).not.toHaveClass("loading-generation-area--field");
    expect(area().querySelector(".loading-generation-area__zone .loading__spinner")).not.toBeNull();
  });

  it("is hidden from assistive tech when decorative", () => {
    render(<LoadingGenerationArea decorative />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(area()).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the content in place of the placeholder when loading ends", () => {
    const { rerender } = render(
      <LoadingGenerationArea loading>
        <p>Loaded content</p>
      </LoadingGenerationArea>,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Loaded content")).not.toBeInTheDocument();

    rerender(
      <LoadingGenerationArea loading={false}>
        <p>Loaded content</p>
      </LoadingGenerationArea>,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Loaded content").parentElement).toHaveClass(
      "loading-generation-area__content",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<LoadingGenerationArea status="Loading data" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
