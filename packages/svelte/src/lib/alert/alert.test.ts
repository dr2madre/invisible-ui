import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./alert.fixture.svelte";
import ActionsFixture from "./alert-actions.fixture.svelte";

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

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, {
      props: { status: "warning", href: "/docs", closable: true },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
