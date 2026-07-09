import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./inline-notification.fixture.svelte";
import ActionsFixture from "./inline-notification-actions.fixture.svelte";
import IconFixture from "./inline-notification-icon.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Alert", () => {
  it("renders a polite status region with title and body", () => {
    render(Fixture);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("data-status", "info");
    expect(screen.getByText("Heads up")).toBeInTheDocument();
    expect(screen.getByText("Something happened you should know about.")).toBeInTheDocument();
  });

  it("reflects the status", () => {
    render(Fixture, { props: { status: "danger" } });
    expect(screen.getByRole("status")).toHaveAttribute("data-status", "danger");
  });

  it("supports an assertive alert role", () => {
    render(Fixture, { props: { role: "alert" } });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders a link when href is provided", () => {
    render(Fixture, { props: { href: "/docs", linkText: "Read the docs" } });
    const link = screen.getByRole("link", { name: "Read the docs" });
    expect(link).toHaveAttribute("href", "/docs");
  });

  it("is not dismissible by default", () => {
    render(Fixture);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a close button when closable and dismisses on click", async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    render(Fixture, { props: { closable: true, onclose } });
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onclose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders action buttons in the actions slot", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(ActionsFixture, { props: { onRetry } });
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders data-driven action buttons", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(Fixture, { props: { actions: [{ label: "Retry", variant: "primary", onClick }] } });
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is named by its title via aria-labelledby (region role included)", () => {
    render(Fixture, { props: { role: "region", title: "Weekly digest" } });
    expect(screen.getByRole("region", { name: "Weekly digest" })).toBeInTheDocument();
  });

  it("is controllable through the open prop", async () => {
    const { rerender } = render(Fixture, { props: { open: false } });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await rerender({ open: true });
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("localizes the default close and link labels through the i18n catalog", () => {
    render(Fixture, { props: { closable: true, href: "/changelog" } });
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learn more" })).toBeInTheDocument();
  });

  it("accepts a custom glyph through the icon slot", () => {
    const { container } = render(IconFixture);
    // The chip stays decorative (aria-hidden), so assert the slotted glyph in the DOM.
    expect(container.querySelector('.feedback-icon path[d^="M18 8A6"]')).not.toBeNull();
  });

  it("snack layout: single row, no description, icon box transparent", () => {
    const { container } = render(Fixture, {
      props: {
        snack: true,
        title: "File moved to trash",
        description: "This should not render in snack mode.",
        actions: [{ label: "Undo" }],
      },
    });
    expect(container.querySelector(".inline-notification[data-snack]")).not.toBeNull();
    expect(screen.getByText("File moved to trash")).toBeInTheDocument();
    // Description is dropped in the snackbar layout.
    expect(container.querySelector(".inline-notification__body")).toBeNull();
    expect(screen.queryByText("This should not render in snack mode.")).not.toBeInTheDocument();
    // Icon has no box (transparent) and the action sits inline.
    expect(container.querySelector('.feedback-icon[data-box="transparent"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, {
      props: { status: "warning", href: "/docs", closable: true },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });

  it("snack layout has no accessibility violations", async () => {
    const { container } = render(Fixture, {
      props: { snack: true, title: "Saved", actions: [{ label: "Undo" }] },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
