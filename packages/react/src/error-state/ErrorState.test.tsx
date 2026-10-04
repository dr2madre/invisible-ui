import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ErrorState, type ErrorStateProps } from "./ErrorState";

const Example = (props: Partial<ErrorStateProps>) => (
  <ErrorState
    title="Couldn't connect to the server"
    description="An unknown error occurred."
    actionLabel="Try again"
    {...props}
  />
);

describe("React ErrorState", () => {
  it("is an alert region with a heading, description and recovery button", () => {
    render(<Example />);
    expect(screen.getByRole("alert")).toHaveAttribute("data-size", "md");
    expect(
      screen.getByRole("heading", { name: "Couldn't connect to the server" }),
    ).toBeInTheDocument();
    expect(screen.getByText("An unknown error occurred.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows the danger feedback icon by default, or a glyph of its own", () => {
    const { rerender } = render(<Example />);
    expect(document.querySelector(".error-state__icon .feedback-icon")).toHaveAttribute(
      "data-status",
      "danger",
    );
    rerender(<Example icon={<svg data-testid="custom-icon" />} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(document.querySelector(".feedback-icon")).toBeNull();
  });

  it("has no close control: an error state is not dismissible", () => {
    render(<Example />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("runs the recovery action on press", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Example onAction={onAction} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders a configurable action group: first action default, the rest ghost", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onBack = vi.fn();
    render(
      <Example
        actions={[
          { label: "Try again", onAction: onRetry },
          { label: "Go back", onAction: onBack },
        ]}
      />,
    );
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
    render(
      <Example
        actions={[
          { label: "Try again" },
          { label: "Contact support", href: "https://example.com/support" },
        ]}
      />,
    );
    const link = screen.getByRole("link", { name: "Contact support" });
    expect(link).toHaveAttribute("href", "https://example.com/support");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("supports the compact size", () => {
    render(<Example size="sm" />);
    expect(screen.getByRole("alert")).toHaveAttribute("data-size", "sm");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Example />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
