import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./toggle-button.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte ToggleButton", () => {
  it("renders an unpressed toggle button (native checkbox)", () => {
    render(Fixture);
    const toggle = screen.getByRole("checkbox", { name: "Bold" });
    expect(toggle).toHaveAttribute("type", "checkbox");
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAttribute("data-state", "off");
  });

  it("toggles on click and the keyboard, reporting changes", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(Fixture, { props: { onPressedChange } });
    const toggle = screen.getByRole("checkbox", { name: "Bold" });

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(toggle).toHaveAttribute("data-state", "on");
    expect(onPressedChange).toHaveBeenCalledWith(true);

    toggle.focus();
    await user.keyboard(" ");
    expect(toggle).not.toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(Fixture, { props: { disabled: true, onPressedChange } });
    const toggle = screen.getByRole("checkbox", { name: "Bold" });

    expect(toggle).toBeDisabled();
    await user.click(toggle);
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
