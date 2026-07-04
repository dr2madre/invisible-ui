import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-toggle-button.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte ToggleButton (styled)", () => {
  it("renders an accessible toggle button with the off state", () => {
    render(Fixture);
    const toggle = screen.getByRole("checkbox", { name: "Bold" });
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAttribute("data-state", "off");
  });

  it("toggles on press and reports the change", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(Fixture, { props: { onPressedChange } });
    const toggle = screen.getByRole("checkbox", { name: "Bold" });

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(toggle).toHaveAttribute("data-state", "on");
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { pressed: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
