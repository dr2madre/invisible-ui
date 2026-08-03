import { render, screen } from "@testing-library/vue";
import { h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { FeedbackIcon } from "./FeedbackIcon";

const statuses = ["info", "success", "warning", "danger", "neutral"] as const;

describe("Vue FeedbackIcon (styled)", () => {
  it("defaults to the info status and renders a built-in icon", () => {
    const { container } = render(FeedbackIcon);
    const box = container.querySelector(".feedback-icon");
    expect(box).toHaveAttribute("data-status", "info");
    expect(box?.querySelector("svg")).toBeInTheDocument();
  });

  it.each(statuses)("renders the %s status", (status) => {
    const { container } = render(FeedbackIcon, { props: { status } });
    expect(container.querySelector(".feedback-icon")).toHaveAttribute("data-status", status);
  });

  it("is decorative (aria-hidden) without a label", () => {
    const { container } = render(FeedbackIcon, { props: { status: "warning" } });
    const box = container.querySelector(".feedback-icon");
    expect(box).toHaveAttribute("aria-hidden", "true");
    expect(box).not.toHaveAttribute("role");
  });

  it("is exposed as an image with a name when labelled", () => {
    render(FeedbackIcon, { props: { status: "danger", label: "Error" } });
    const img = screen.getByRole("img", { name: "Error" });
    expect(img).toHaveAttribute("data-status", "danger");
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it("renders a custom icon passed via the slot instead of the default", () => {
    const { container } = render(FeedbackIcon, {
      props: { status: "success" },
      slots: {
        default: () =>
          h("svg", { "data-testid": "custom-icon", viewBox: "0 0 24 24" }, [
            h("circle", { cx: "12", cy: "12", r: "6" }),
          ]),
      },
    });
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    // Only the slotted icon is rendered (the built-in fallback is replaced).
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("has no accessibility violations (labelled and decorative)", async () => {
    const labelled = render(FeedbackIcon, { props: { status: "info", label: "Information" } });
    expect(await axe(labelled.container)).toHaveNoViolations();

    const decorative = render(FeedbackIcon, { props: { status: "neutral" } });
    expect(await axe(decorative.container)).toHaveNoViolations();
  });
});
