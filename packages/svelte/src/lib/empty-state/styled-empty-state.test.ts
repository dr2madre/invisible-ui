import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./empty-state.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte EmptyState", () => {
  it("is a status region with a heading, description and action button", () => {
    render(Fixture);
    const region = screen.getByRole("status");
    expect(region).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No projects yet" })).toBeInTheDocument();
    expect(screen.getByText("Create your first project to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a project" })).toBeInTheDocument();
  });

  it("is not an alert — nothing failed", () => {
    render(Fixture);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the theme's feedback icon as the fallback illustration", () => {
    const { container } = render(Fixture);
    expect(container.querySelector(".feedback-icon")).toBeInTheDocument();
  });

  it("replaces the fallback with a custom illustration through the slot", () => {
    const { container } = render(Fixture, { props: { withIllustration: true } });
    expect(screen.getByTestId("custom-illustration")).toBeInTheDocument();
    expect(container.querySelector(".feedback-icon")).not.toBeInTheDocument();
  });

  it("renders a configurable action group: first action default, the rest ghost", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onImport = vi.fn();
    render(Fixture, {
      props: {
        actions: [
          { label: "Add a project", onAction: onAdd },
          { label: "Import", onAction: onImport },
        ],
      },
    });
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
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
    render(Fixture, {
      props: {
        actions: [
          { label: "Add a project" },
          { label: "Learn more", href: "https://example.com/docs" },
        ],
      },
    });
    const link = screen.getByRole("link", { name: "Learn more" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(screen.getByRole("button", { name: "Add a project" })).toBeInTheDocument();
  });

  it("supports the compact size", () => {
    render(Fixture, { props: { size: "sm" } });
    expect(screen.getByRole("status")).toHaveAttribute("data-size", "sm");
  });

  it("runs the action on press", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(Fixture, { props: { onAction } });
    await user.click(screen.getByRole("button", { name: "Add a project" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
