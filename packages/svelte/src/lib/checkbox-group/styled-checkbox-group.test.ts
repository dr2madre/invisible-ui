import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./checkbox-group.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte CheckboxGroup (styled)", () => {
  it("renders a named group of checkboxes", () => {
    render(Fixture);
    expect(screen.getByRole("group", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Email" })).toHaveAttribute(
      "data-state",
      "unchecked",
    );
  });

  it("toggles multiple items and reports the selection", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });

    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["email"]);
    await user.click(screen.getByRole("checkbox", { name: "Push" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["email", "push"]);

    // Toggling off removes it.
    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["push"]);
  });

  it("reflects the initial selection and marks disabled items", () => {
    render(Fixture, { props: { value: ["push"] } });
    expect(screen.getByRole("checkbox", { name: "Push" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "SMS" })).toBeDisabled();
  });

  it("toggles with the Space key", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });
    const email = screen.getByRole("checkbox", { name: "Email" });

    email.focus();
    await user.keyboard(" ");
    expect(onValueChange).toHaveBeenLastCalledWith(["email"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: ["email"] } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
