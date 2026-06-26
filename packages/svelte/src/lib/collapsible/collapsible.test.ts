import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./collapsible.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Collapsible", () => {
  it("renders a trigger linked to hidden content when closed", () => {
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Toggle" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", "col-content");
    expect(screen.getByText("Content")).not.toBeVisible();
  });

  it("expands the content on click and collapses it again", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const trigger = screen.getByRole("button", { name: "Toggle" });

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Content")).toBeVisible();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Content")).not.toBeVisible();
  });

  it("renders open when initialised open", () => {
    render(Fixture, { props: { open: true } });
    expect(screen.getByRole("button", { name: "Toggle" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Content")).toBeVisible();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { disabled: true } });
    const trigger = screen.getByRole("button", { name: "Toggle" });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(Fixture, { props: { open: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
