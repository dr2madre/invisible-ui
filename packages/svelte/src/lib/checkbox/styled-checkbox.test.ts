import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-checkbox.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Checkbox (styled)", () => {
  it("renders an accessible checkbox labelled by its visible text", () => {
    render(Fixture);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox).toHaveAttribute("data-state", "unchecked");
  });

  it("reflects the checked state via data-state and reports changes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Fixture, { props: { onCheckedChange } });
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("data-state", "checked");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("renders the indeterminate state", () => {
    render(Fixture, { props: { checked: "indeterminate" } });
    expect(screen.getByRole("checkbox")).toHaveAttribute("data-state", "indeterminate");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { checked: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

// Task 5B prerequisite: checked and disabled are controllable mirrors, so a
// checkbox driven by external state (a table selection column) follows it.
describe("Svelte Checkbox (controlled sync)", () => {
  const box = () => screen.getByRole("checkbox", { name: "Accept terms" });

  it("reflects a later checked value, indeterminate included, without a callback", async () => {
    const onCheckedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { checked: false, onCheckedChange } });
    expect(box()).not.toBeChecked();

    await rerender({ checked: true, onCheckedChange });
    expect(box()).toBeChecked();

    await rerender({ checked: "indeterminate", onCheckedChange });
    expect(box()).toHaveAttribute("data-state", "indeterminate");
    expect((box() as HTMLInputElement).indeterminate).toBe(true);

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("accepts a user action after disabled goes true to false", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { disabled: true, onCheckedChange } });

    await rerender({ disabled: false, onCheckedChange });
    await user.click(box());
    expect(box()).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("blocks the action after disabled goes false to true", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { disabled: false, onCheckedChange } });

    await rerender({ disabled: true, onCheckedChange });
    await user.click(box());
    expect(box()).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("leaves an uncontrolled consumer untouched across unrelated rerenders", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { checked: false, onCheckedChange } });

    await user.click(box());
    expect(box()).toBeChecked();

    // The checked prop did not change, so the mirror must not snap it back.
    await rerender({ checked: false, hideLabel: false, onCheckedChange });
    expect(box()).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
  });

  it("hides the label visually while keeping the accessible name", () => {
    render(Fixture, { props: { hideLabel: true } });
    expect(box()).toHaveAccessibleName("Accept terms");
    expect(document.querySelector(".field__label--hidden")).not.toBeNull();
  });
});
