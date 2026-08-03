import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { EmptyState } from "./EmptyState";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const base = {
  title: "No projects yet",
  description: "Create your first project to get started.",
};

describe("Vue EmptyState", () => {
  it("is a status region with a heading, description and action button", () => {
    render(EmptyState, { props: { ...base, actionLabel: "Add a project" } });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No projects yet" })).toBeInTheDocument();
    expect(screen.getByText("Create your first project to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a project" })).toBeInTheDocument();
  });

  it("is a status, never an alert: nothing failed", () => {
    render(EmptyState, { props: { ...base, actionLabel: "Add a project" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the theme's feedback icon as the fallback illustration", () => {
    const { container } = render(EmptyState, { props: base });
    expect(container.querySelector(".feedback-icon")).toBeInTheDocument();
  });

  it("replaces the fallback with a custom illustration through the slot", () => {
    const { container } = render(EmptyState, {
      props: base,
      slots: {
        illustration: () =>
          h("svg", { "data-testid": "custom-illustration", viewBox: "0 0 24 24" }),
      },
    });
    expect(screen.getByTestId("custom-illustration")).toBeInTheDocument();
    expect(container.querySelector(".feedback-icon")).not.toBeInTheDocument();
  });

  it("renders a configurable action group: first action default, the rest ghost", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onImport = vi.fn();
    render(EmptyState, {
      props: {
        ...base,
        actions: [
          { label: "Add a project", onAction: onAdd },
          { label: "Import", onAction: onImport },
        ],
      },
    });
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
    render(EmptyState, {
      props: {
        ...base,
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
    render(EmptyState, { props: { ...base, size: "sm" } });
    expect(screen.getByRole("status")).toHaveAttribute("data-size", "sm");
  });

  it("runs the action on press", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(EmptyState, { props: { ...base, actionLabel: "Add a project", onAction } });
    await user.click(screen.getByRole("button", { name: "Add a project" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(EmptyState, {
      props: { ...base, actionLabel: "Add a project" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
