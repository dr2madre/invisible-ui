import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { CheckboxGroup } from "./CheckboxGroup";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS", disabled: true },
  { value: "push", label: "Push" },
];

describe("Vue CheckboxGroup (styled)", () => {
  it("renders a named group of checkboxes", () => {
    render(CheckboxGroup, { props: { items, label: "Notifications" } });
    expect(screen.getByRole("group", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Email" })).toHaveAttribute(
      "data-state",
      "unchecked",
    );
  });

  it("toggles multiple items and reports the selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(CheckboxGroup, { props: { items, label: "Notifications", onValueChange } });

    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["email"]);
    await user.click(screen.getByRole("checkbox", { name: "Push" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["email", "push"]);

    // Toggling off removes it.
    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["push"]);
  });

  it("supports v-model: emits update:modelValue with the selection", async () => {
    const user = userEvent.setup();
    const { emitted } = render(CheckboxGroup, {
      props: { items, label: "Notifications", modelValue: [] },
    });

    await user.click(screen.getByRole("checkbox", { name: "Push" }));
    expect(emitted("update:modelValue")).toEqual([[["push"]]]);
  });

  it("reflects the initial selection and marks disabled items", () => {
    render(CheckboxGroup, { props: { items, label: "Notifications", value: ["push"] } });
    expect(screen.getByRole("checkbox", { name: "Push" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "SMS" })).toBeDisabled();
  });

  it("toggles with the Space key", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(CheckboxGroup, { props: { items, label: "Notifications", onValueChange } });
    const email = screen.getByRole("checkbox", { name: "Email" });

    email.focus();
    await user.keyboard(" ");
    expect(onValueChange).toHaveBeenLastCalledWith(["email"]);
  });

  it("submits every checked item's value under the shared name", async () => {
    const user = userEvent.setup();
    const Fixture = defineComponent({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(CheckboxGroup, {
            label: "Notifications",
            name: "notifications",
            value: ["email"],
            items,
          }),
        ]),
    });
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;

    expect(new FormData(form).getAll("notifications")).toEqual(["email"]);

    await user.click(screen.getByRole("checkbox", { name: "Push" }));
    expect(new FormData(form).getAll("notifications")).toEqual(["email", "push"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(CheckboxGroup, {
      props: { items, label: "Notifications", value: ["email"] },
    });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
