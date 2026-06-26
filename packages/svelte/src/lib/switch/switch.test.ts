import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./switch.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Switch", () => {
  it("renders an accessible, off switch", () => {
    render(Fixture);
    const sw = screen.getByRole("switch", { name: "Wi-Fi" });
    expect(sw).not.toBeChecked();
    expect(sw).toHaveAttribute("data-state", "unchecked");
  });

  it("turns on with click and the keyboard, reporting changes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Fixture, { props: { onCheckedChange } });
    const sw = screen.getByRole("switch", { name: "Wi-Fi" });

    await user.click(sw);
    expect(sw).toBeChecked();
    expect(sw).toHaveAttribute("data-state", "checked");
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    sw.focus();
    await user.keyboard(" ");
    expect(sw).not.toBeChecked();
  });

  it("does not change when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Fixture, { props: { disabled: true, onCheckedChange } });
    const sw = screen.getByRole("switch", { name: "Wi-Fi" });

    expect(sw).toBeDisabled();
    await user.click(sw);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
