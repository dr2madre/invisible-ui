import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./checkbox.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Checkbox (native input)", () => {
  it("renders an accessible, unchecked checkbox", () => {
    render(Fixture);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAttribute("data-state", "unchecked");
  });

  it("checks on click and reports the change", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Fixture, { props: { onCheckedChange } });
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAttribute("data-state", "checked");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles with the Space key", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox).toBeChecked();
  });

  it("renders the indeterminate state and resolves to checked on click", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { checked: "indeterminate" } });
    const checkbox = screen.getByRole<HTMLInputElement>("checkbox", { name: "Accept terms" });

    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox).toHaveAttribute("data-state", "indeterminate");

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(checkbox.indeterminate).toBe(false);
  });

  it("does not change when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Fixture, { props: { disabled: true, onCheckedChange } });
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    expect(checkbox).toBeDisabled();
    await user.click(checkbox);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
