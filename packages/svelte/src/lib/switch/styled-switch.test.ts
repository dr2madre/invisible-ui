import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-switch.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Switch (styled)", () => {
  it("renders an accessible switch labelled by its visible text", () => {
    render(Fixture);
    const control = screen.getByRole("switch", { name: "Wi-Fi" });
    expect(control).toHaveAttribute("data-state", "unchecked");
  });

  it("reflects the on state via data-state and reports changes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Fixture, { props: { onCheckedChange } });
    const control = screen.getByRole("switch", { name: "Wi-Fi" });

    await user.click(control);
    expect(control).toHaveAttribute("data-state", "checked");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { checked: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
