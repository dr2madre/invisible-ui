import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ToggleButton } from "./ToggleButton";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const bold = (pressed?: boolean) =>
  screen.getByRole("button", pressed === undefined ? { name: "Bold" } : { name: "Bold", pressed });

/** Reset resolves one task after the event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Vue ToggleButton (styled)", () => {
  it("renders an unpressed native button with aria-pressed", () => {
    render(ToggleButton, { props: { label: "Bold" }, slots: { default: "B" } });
    expect(bold(false)).toHaveAttribute("type", "button");
    expect(bold()).toHaveAttribute("aria-pressed", "false");
    expect(bold()).toHaveAttribute("data-state", "off");
    expect(bold()).toHaveClass("toggle");
    expect(bold().querySelector(".toggle__surface")).not.toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("toggles on click, reporting changes, and keeps its name", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(ToggleButton, { props: { label: "Bold", onPressedChange }, slots: { default: "B" } });

    await user.click(bold(false));
    expect(bold(true)).toHaveAttribute("data-state", "on");
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(bold()).toHaveAccessibleName("Bold");
  });

  it("toggles with Enter and Space", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(ToggleButton, { props: { label: "Bold", onPressedChange }, slots: { default: "B" } });

    bold().focus();
    await user.keyboard("{Enter}");
    expect(bold(true)).toBeInTheDocument();
    await user.keyboard(" ");
    expect(bold(false)).toBeInTheDocument();
    expect(onPressedChange.mock.calls).toEqual([[true], [false]]);
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
    expect(bold(false)).toBeInTheDocument();
    await rerender({ pressed: true });
    expect(bold(true)).toBeInTheDocument();
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
    expect(bold(false)).toBeInTheDocument();
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

  it("submits its value under the field name only while pressed", async () => {
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
    await user.click(bold());
    expect(new FormData(form).get("style")).toBeNull();
  });

  it("is not submitted while disabled, even when pressed", () => {
    const Fixture = defineComponent({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(ToggleButton, { label: "Bold", name: "style", pressed: true, disabled: true }),
        ]),
    });
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("style")).toBeNull();
  });

  it("puts the default back on form reset without reporting a change", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const bound = ref(false);
    const Fixture = defineComponent({
      setup: () => () =>
        h("form", { "data-testid": "form" }, [
          h(ToggleButton, {
            label: "Bold",
            name: "style",
            modelValue: bound.value,
            "onUpdate:modelValue": (next: boolean) => (bound.value = next),
            onPressedChange,
          }),
        ]),
    });
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;

    await user.click(bold());
    expect(new FormData(form).get("style")).toBe("on");
    expect(onPressedChange).toHaveBeenCalledTimes(1);

    form.reset();
    await settled();
    expect(bold(false)).toBeInTheDocument();
    expect(new FormData(form).get("style")).toBeNull();
    expect(bound.value).toBe(false);
    expect(onPressedChange).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(ToggleButton, {
      props: { label: "Bold", pressed: true },
      slots: { default: "B" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

describe("Vue ToggleButton error", () => {
  it("shows the error after the button as an alert that describes it, without aria-invalid", async () => {
    const { rerender } = render(ToggleButton, {
      props: { label: "Bold", error: "Bold is unavailable" },
      slots: { default: "B" },
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Bold is unavailable");
    expect(bold().nextElementSibling).toBe(alert);
    expect(bold()).toHaveAttribute("aria-describedby", alert.id);
    expect(bold()).toHaveAccessibleDescription("Bold is unavailable");
    expect(bold()).not.toHaveAttribute("aria-invalid");

    await rerender({ error: "" });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(bold()).not.toHaveAttribute("aria-describedby");
  });

  it("keeps its attributes on the button beside the message", () => {
    render(ToggleButton, {
      props: { label: "Bold", error: "Bold is unavailable" },
      attrs: { class: "extra", "data-test": "toggle", "aria-describedby": "hint" },
      slots: { default: "B" },
    });
    expect(bold()).toHaveClass("toggle", "extra");
    expect(bold()).toHaveAttribute("data-test", "toggle");
    expect(bold()).toHaveAttribute("aria-describedby", `hint ${screen.getByRole("alert").id}`);
  });

  it("has no accessibility violations with an error", async () => {
    const { container } = render(ToggleButton, {
      props: { label: "Bold", error: "Bold is unavailable" },
      slots: { default: "B" },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
