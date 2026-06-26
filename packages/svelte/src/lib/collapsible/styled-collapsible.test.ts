import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-collapsible.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Collapsible (styled)", () => {
  it("renders the trigger slot and keeps content hidden when closed", () => {
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(screen.getByText("Hidden details here.")).not.toBeVisible();
  });

  it("toggles open on click and reports the change", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Fixture, { props: { onOpenChange } });

    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Hidden details here.")).toBeVisible();
  });

  it("renders open and reports closing", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Fixture, { props: { open: true, onOpenChange } });
    expect(screen.getByText("Hidden details here.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(Fixture, { props: { open: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
