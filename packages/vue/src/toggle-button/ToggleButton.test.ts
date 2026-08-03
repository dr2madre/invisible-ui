import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ToggleButton } from "./ToggleButton";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const bold = () => screen.getByRole("checkbox", { name: "Bold" });

describe("Vue ToggleButton (styled)", () => {
  it("renders an unpressed toggle button (native checkbox)", () => {
    render(ToggleButton, { props: { label: "Bold" }, slots: { default: "B" } });
    expect(bold()).toHaveAttribute("type", "checkbox");
    expect(bold()).not.toBeChecked();
    expect(bold()).toHaveAttribute("data-state", "off");
  });

  it("toggles on click and the keyboard, reporting changes", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(ToggleButton, { props: { label: "Bold", onPressedChange }, slots: { default: "B" } });

    await user.click(bold());
    expect(bold()).toBeChecked();
    expect(bold()).toHaveAttribute("data-state", "on");
    expect(onPressedChange).toHaveBeenCalledWith(true);

    bold().focus();
    await user.keyboard(" ");
    expect(bold()).not.toBeChecked();
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it("supports v-model: emits update:modelValue on press", async () => {
    const user = userEvent.setup();
    const { emitted } = render(ToggleButton, {
      props: { label: "Bold", modelValue: false },
      slots: { default: "B" },
    });

    await user.click(bold());
    expect(emitted("update:modelValue")).toEqual([[true]]);
  });

  it("mirrors an externally controlled pressed value", async () => {
    const { rerender } = render(ToggleButton, {
      props: { label: "Bold", pressed: false },
      slots: { default: "B" },
    });
    expect(bold()).not.toBeChecked();
    await rerender({ pressed: true });
    expect(bold()).toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(ToggleButton, {
      props: { label: "Bold", disabled: true, onPressedChange },
      slots: { default: "B" },
    });

    expect(bold()).toBeDisabled();
    await user.click(bold());
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("shows the leading checkmark only while pressed with `check`", async () => {
    const { container, rerender } = render(ToggleButton, {
      props: { label: "Unread", check: true, pressed: false },
      slots: { default: "Unread" },
    });
    expect(container.querySelector(".toggle__check")).toBeNull();
    await rerender({ pressed: true });
    expect(container.querySelector(".toggle__check")).not.toBeNull();
  });

  it("submits its value under the field name when pressed", async () => {
    const user = userEvent.setup();
    const Fixture = defineComponent({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(ToggleButton, { label: "Bold", name: "style", value: "bold" }, () => "B"),
        ]),
    });
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;

    expect(new FormData(form).get("style")).toBeNull();
    await user.click(bold());
    expect(new FormData(form).get("style")).toBe("bold");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(ToggleButton, {
      props: { label: "Bold", pressed: true },
      slots: { default: "B" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
