import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./toggle-button.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte ToggleButton", () => {
  it("renders an unpressed toggle button (aria-pressed)", () => {
    render(Fixture);
    const button = screen.getByRole("button", { name: "Bold" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAttribute("data-state", "off");
  });

  it("toggles on click and the keyboard, reporting changes", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(Fixture, { props: { onPressedChange } });
    const button = screen.getByRole("button", { name: "Bold" });

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAttribute("data-state", "on");
    expect(onPressedChange).toHaveBeenCalledWith(true);

    button.focus();
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(Fixture, { props: { disabled: true, onPressedChange } });
    const button = screen.getByRole("button", { name: "Bold" });

    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
