import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ToggleButton } from "./ToggleButton";

const bold = () => screen.getByRole("button", { name: "Bold" });

describe("React ToggleButton (styled)", () => {
  it("renders an unpressed native button carrying aria-pressed", () => {
    render(<ToggleButton label="Bold">B</ToggleButton>);
    expect(screen.getByRole("button", { name: "Bold", pressed: false })).toBe(bold());
    expect(bold().tagName).toBe("BUTTON");
    expect(bold()).toHaveAttribute("type", "button");
    expect(bold()).toHaveClass("toggle");
    expect(bold()).toHaveAttribute("data-state", "off");
  });

  it("toggles on click, reporting each change once", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <ToggleButton label="Bold" onPressedChange={onPressedChange}>
        B
      </ToggleButton>,
    );
    await user.click(bold());
    expect(screen.getByRole("button", { name: "Bold", pressed: true })).toBe(bold());
    expect(bold()).toHaveAttribute("data-state", "on");
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(onPressedChange).toHaveBeenCalledTimes(1);
  });

  it("toggles with Enter and with Space", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <ToggleButton label="Bold" onPressedChange={onPressedChange}>
        B
      </ToggleButton>,
    );
    bold().focus();
    await user.keyboard("{Enter}");
    expect(bold()).toHaveAttribute("aria-pressed", "true");
    await user.keyboard(" ");
    expect(bold()).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange.mock.calls).toEqual([[true], [false]]);
  });

  it("keeps the same accessible name in both states", async () => {
    const user = userEvent.setup();
    render(<ToggleButton>Bold</ToggleButton>);
    const before = bold();
    await user.click(before);
    expect(screen.getByRole("button", { name: "Bold", pressed: true })).toBe(before);
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
    expect(bold()).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("does not toggle when disabled, keeps its value and submits nothing", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const Page = ({ disabled }: { disabled: boolean }) => (
      <form data-testid="form">
        <ToggleButton
          label="Bold"
          name="style"
          value="bold"
          pressed
          disabled={disabled}
          onPressedChange={onPressedChange}
        >
          B
        </ToggleButton>
      </form>
    );
    const { rerender } = render(<Page disabled={false} />);
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("style")).toBe("bold");
    rerender(<Page disabled />);
    expect(bold()).toBeDisabled();
    expect(bold()).toHaveAttribute("aria-pressed", "true");
    expect(new FormData(form).get("style")).toBeNull();
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

  it("submits its value under the field name only while pressed", async () => {
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
    await user.click(bold());
    expect(new FormData(form).get("style")).toBeNull();
  });

  it("puts the default back on its form's reset, without reporting", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <form data-testid="form">
        <ToggleButton label="Bold" name="style" onPressedChange={onPressedChange}>
          B
        </ToggleButton>
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    await user.click(bold());
    expect(new FormData(form).get("style")).toBe("on");
    await act(async () => {
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(bold()).toHaveAttribute("aria-pressed", "false");
    expect(new FormData(form).get("style")).toBeNull();
    expect(onPressedChange).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ToggleButton label="Bold" pressed check name="style">
        B
      </ToggleButton>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
