import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { FeedbackIcon } from "./FeedbackIcon";

const statuses = ["info", "success", "warning", "danger", "neutral"] as const;
const box = () => document.querySelector<HTMLElement>(".feedback-icon")!;

describe("React FeedbackIcon", () => {
  it("defaults to the info status, a tinted rounded box, and a built-in icon", () => {
    render(<FeedbackIcon />);
    expect(box()).toHaveAttribute("data-status", "info");
    expect(box()).toHaveAttribute("data-box", "tint");
    expect(box()).toHaveAttribute("data-shape", "rounded");
    expect(box().querySelector("svg")).toBeInTheDocument();
  });

  it.each(statuses)("renders the %s status", (status) => {
    render(<FeedbackIcon status={status} />);
    expect(box()).toHaveAttribute("data-status", status);
  });

  it("draws a different glyph for each status", () => {
    const glyphs = statuses.map((status) => {
      const { unmount } = render(<FeedbackIcon status={status} />);
      const html = box().querySelector("svg")!.innerHTML;
      unmount();
      return html;
    });
    expect(new Set(glyphs).size).toBe(statuses.length);
  });

  it("is decorative (aria-hidden) without a label", () => {
    render(<FeedbackIcon status="warning" />);
    expect(box()).toHaveAttribute("aria-hidden", "true");
    expect(box()).not.toHaveAttribute("role");
  });

  it("is exposed as an image with a name when labelled", () => {
    render(<FeedbackIcon status="danger" label="Error" />);
    const img = screen.getByRole("img", { name: "Error" });
    expect(img).toHaveAttribute("data-status", "danger");
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it("renders a custom icon passed as children instead of the default", () => {
    render(
      <FeedbackIcon status="success" box="solid" shape="round">
        <svg data-testid="custom-icon" />
      </FeedbackIcon>,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(box().querySelectorAll("svg")).toHaveLength(1);
    expect(box()).toHaveAttribute("data-box", "solid");
    expect(box()).toHaveAttribute("data-shape", "round");
  });

  it("has no accessibility violations (labelled and decorative)", async () => {
    const labelled = render(<FeedbackIcon status="info" label="Information" />);
    expect(await axe(labelled.container)).toHaveNoViolations();
    labelled.unmount();

    const decorative = render(<FeedbackIcon status="neutral" />);
    expect(await axe(decorative.container)).toHaveNoViolations();
  });
});
