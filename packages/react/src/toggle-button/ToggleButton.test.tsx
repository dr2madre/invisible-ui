import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ToggleButton } from "./ToggleButton";

const bold = () => screen.getByRole("checkbox", { name: "Bold" });

describe("React ToggleButton (styled)", () => {
  it("renders an unpressed toggle button (native checkbox)", () => {
    render(<ToggleButton label="Bold">B</ToggleButton>);
    expect(bold()).toHaveAttribute("type", "checkbox");
    expect(bold()).not.toBeChecked();
    expect(bold()).toHaveAttribute("data-state", "off");
  });

  it("toggles on click and the keyboard, reporting each change once", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <ToggleButton label="Bold" onPressedChange={onPressedChange}>
        B
      </ToggleButton>,
    );
    await user.click(bold());
    expect(bold()).toBeChecked();
    expect(bold()).toHaveAttribute("data-state", "on");
    expect(onPressedChange).toHaveBeenCalledWith(true);
    bold().focus();
    await user.keyboard(" ");
    expect(bold()).not.toBeChecked();
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
    expect(onPressedChange).toHaveBeenCalledTimes(2);
  });

  it("mirrors an externally controlled pressed value without reporting", () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <ToggleButton label="Bold" pressed={false} onPressedChange={onPressedChange}>
        B
      </ToggleButton>,
    );
    rerender(
      <ToggleButton label="Bold" pressed onPressedChange={onPressedChange}>
        B
      </ToggleButton>,
    );
    expect(bold()).toBeChecked();
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("does not toggle when disabled, and keeps its value while disabled", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <ToggleButton label="Bold" pressed onPressedChange={onPressedChange}>
        B
      </ToggleButton>,
    );
    rerender(
      <ToggleButton label="Bold" pressed disabled onPressedChange={onPressedChange}>
        B
      </ToggleButton>,
    );
    expect(bold()).toBeDisabled();
    expect(bold()).toBeChecked();
    expect(bold().closest(".toggle")).toHaveClass("toggle--disabled");
    await user.click(bold());
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("shows the leading checkmark only while pressed with `check`", () => {
    const { container, rerender } = render(
      <ToggleButton label="Unread" check pressed={false}>
        Unread
      </ToggleButton>,
    );
    expect(container.querySelector(".toggle__check")).toBeNull();
    rerender(
      <ToggleButton label="Unread" check pressed>
        Unread
      </ToggleButton>,
    );
    expect(container.querySelector(".toggle__check")).not.toBeNull();
  });

  it("submits its value under the field name when pressed", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <ToggleButton label="Bold" name="style" value="bold">
          B
        </ToggleButton>
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("style")).toBeNull();
    await user.click(bold());
    expect(new FormData(form).get("style")).toBe("bold");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ToggleButton label="Bold" pressed check>
        B
      </ToggleButton>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
