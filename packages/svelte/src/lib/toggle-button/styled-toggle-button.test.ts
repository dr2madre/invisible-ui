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

// The disabled prop is controlled: a consumer can turn a control off and on
// again while it is on screen.
describe("Svelte ToggleButton (disabled after mount)", () => {
  const toggle = () => screen.getByRole("checkbox", { name: "Bold" });

  it("disables the native input and its styling when the prop turns on", async () => {
    const { rerender } = render(Fixture);
    expect(toggle()).toBeEnabled();

    await rerender({ disabled: true });
    expect(toggle()).toBeDisabled();
    expect(toggle()).toHaveAttribute("data-disabled", "");
    expect(toggle().closest("label")).toHaveClass("toggle--disabled");
  });

  it("keeps the pressed value while disabled and reports nothing", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { pressed: true, onPressedChange } });

    await rerender({ pressed: true, disabled: true, onPressedChange });
    expect(toggle()).toBeChecked();

    await user.click(toggle());
    expect(toggle()).toBeChecked();
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("restores pointer and keyboard activation when the prop turns off", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { disabled: true, onPressedChange } });

    await rerender({ disabled: false, onPressedChange });
    await user.click(toggle());
    expect(toggle()).toBeChecked();
    expect(onPressedChange).toHaveBeenLastCalledWith(true);

    await user.keyboard(" ");
    expect(toggle()).not.toBeChecked();
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it("accepts a new pressed value in the same update that re-enables it", async () => {
    const { rerender } = render(Fixture, { props: { disabled: true } });
    await rerender({ disabled: false, pressed: true });

    expect(toggle()).toBeChecked();
    expect(toggle()).toHaveAttribute("data-state", "on");
  });
});
