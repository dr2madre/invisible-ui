import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ErrorState } from "./ErrorState";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const base = {
  title: "Couldn't connect to the server",
  description: "An unknown error occurred.",
};

describe("Vue ErrorState", () => {
  it("is an alert region with a heading, description and recovery button", () => {
    render(ErrorState, { props: { ...base, actionLabel: "Try again" } });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Couldn't connect to the server" }),
    ).toBeInTheDocument();
    expect(screen.getByText("An unknown error occurred.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("has no close control: an error state stays until it is resolved", () => {
    render(ErrorState, { props: { ...base, actionLabel: "Try again" } });
    // The only control is the recovery action.
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("runs the recovery action on press", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(ErrorState, { props: { ...base, actionLabel: "Try again", onAction } });
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders a configurable action group: first action default, the rest ghost", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onBack = vi.fn();
    render(ErrorState, {
      props: {
        ...base,
        actions: [
          { label: "Try again", onAction: onRetry },
          { label: "Go back", onAction: onBack },
        ],
      },
    });
    expect(screen.getAllByRole("button")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Try again" })).toHaveAttribute(
      "data-variant",
      "default",
    );
    expect(screen.getByRole("button", { name: "Go back" })).toHaveAttribute(
      "data-variant",
      "ghost",
    );
  });

  it("renders an action with href as a link", () => {
    render(ErrorState, {
      props: {
        ...base,
        actions: [
          { label: "Try again" },
          { label: "Contact support", href: "https://example.com/support" },
        ],
      },
    });
    const link = screen.getByRole("link", { name: "Contact support" });
    expect(link).toHaveAttribute("href", "https://example.com/support");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("replaces the status icon through the icon slot", () => {
    const { container } = render(ErrorState, {
      props: base,
      slots: { icon: () => h("svg", { "data-testid": "custom-artwork", viewBox: "0 0 24 24" }) },
    });
    expect(screen.getByTestId("custom-artwork")).toBeInTheDocument();
    expect(container.querySelector(".feedback-icon")).not.toBeInTheDocument();
  });

  it("supports the compact size", () => {
    render(ErrorState, { props: { ...base, size: "sm" } });
    expect(screen.getByRole("alert")).toHaveAttribute("data-size", "sm");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(ErrorState, { props: { ...base, actionLabel: "Try again" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
