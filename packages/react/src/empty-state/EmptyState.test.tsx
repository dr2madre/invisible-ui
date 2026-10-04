import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import { EmptyState, type EmptyStateProps } from "./EmptyState";

const Example = (props: Partial<EmptyStateProps>) => (
  <EmptyState
    title="No projects yet"
    description="Create your first project to get started."
    actionLabel="Add a project"
    {...props}
  />
);

describe("React EmptyState", () => {
  it("is a status region with a heading, description and action button", () => {
    render(<Example />);
    expect(screen.getByRole("status")).toHaveAttribute("data-size", "md");
    expect(screen.getByRole("heading", { level: 2, name: "No projects yet" })).toBeInTheDocument();
    expect(screen.getByText("Create your first project to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a project" })).toHaveAttribute(
      "data-variant",
      "default",
    );
  });

  it("is not an alert: nothing failed", () => {
    render(<Example />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the theme's neutral feedback icon as the fallback illustration", () => {
    render(<Example />);
    const icon = document.querySelector(".empty-state__illustration .feedback-icon")!;
    expect(icon).toHaveAttribute("data-status", "neutral");
    expect(icon).toHaveAttribute("data-shape", "round");
  });

  it("replaces the fallback with a custom illustration", () => {
    render(<Example illustration={<svg data-testid="custom-illustration" />} />);
    expect(screen.getByTestId("custom-illustration")).toBeInTheDocument();
    expect(document.querySelector(".feedback-icon")).not.toBeInTheDocument();
  });

  it("sets the heading level", () => {
    render(<Example headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3, name: "No projects yet" })).toBeInTheDocument();
  });

  it("renders a configurable action group: first action default, the rest ghost", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onImport = vi.fn();
    render(
      <Example
        actions={[
          { label: "Add a project", onAction: onAdd },
          { label: "Import", onAction: onImport },
        ]}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Add a project" })).toHaveAttribute(
      "data-variant",
      "default",
    );
    expect(screen.getByRole("button", { name: "Import" })).toHaveAttribute("data-variant", "ghost");
  });

  it("renders an action with href as a link", () => {
    render(
      <Example
        actions={[
          { label: "Add a project" },
          { label: "Learn more", href: "https://example.com/docs", target: "_blank" },
        ]}
      />,
    );
    const link = screen.getByRole("link", { name: "Learn more" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("button", { name: "Add a project" })).toBeInTheDocument();
  });

  it("takes markup of its own for the action area", () => {
    render(<Example actions={<Button variant="primary">Upload</Button>} />);
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add a project" })).not.toBeInTheDocument();
  });

  it("renders no action area without an action", () => {
    render(<EmptyState title="Inbox zero" />);
    expect(document.querySelector(".empty-state__actions")).toBeNull();
  });

  it("supports the compact size", () => {
    render(<Example size="sm" />);
    expect(screen.getByRole("status")).toHaveAttribute("data-size", "sm");
  });

  it("runs the action on press", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Example onAction={onAction} />);
    await user.click(screen.getByRole("button", { name: "Add a project" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Example />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
