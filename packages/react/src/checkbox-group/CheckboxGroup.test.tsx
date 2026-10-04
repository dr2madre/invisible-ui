import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { CheckboxGroup } from "./CheckboxGroup";

const items = [
  { value: "basil", label: "Basil" },
  { value: "olives", label: "Olives" },
  { value: "anchovies", label: "Anchovies", disabled: true },
];
const box = (name: string) => screen.getByRole("checkbox", { name });

describe("React CheckboxGroup (styled)", () => {
  it("renders a named group of native checkboxes", () => {
    render(<CheckboxGroup items={items} label="Toppings" />);
    const group = screen.getByRole("group", { name: "Toppings" });
    expect(group.tagName).toBe("FIELDSET");
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(box("Basil")).toHaveAttribute("type", "checkbox");
  });

  it("toggles multiple items and reports the selection, once per action", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CheckboxGroup items={items} label="Toppings" onValueChange={onValueChange} />);
    await user.click(box("Basil"));
    expect(onValueChange).toHaveBeenLastCalledWith(["basil"]);
    await user.click(box("Olives"));
    expect(onValueChange).toHaveBeenLastCalledWith(["basil", "olives"]);
    await user.click(box("Basil"));
    expect(onValueChange).toHaveBeenLastCalledWith(["olives"]);
    expect(onValueChange).toHaveBeenCalledTimes(3);
    expect(box("Olives")).toHaveAttribute("data-state", "checked");
  });

  it("reflects the initial selection and marks disabled items", () => {
    render(<CheckboxGroup items={items} label="Toppings" value={["olives"]} />);
    expect(box("Olives")).toBeChecked();
    expect(box("Basil")).not.toBeChecked();
    expect(box("Anchovies")).toBeDisabled();
  });

  it("toggles with the Space key, each box its own tab stop", async () => {
    const user = userEvent.setup();
    render(<CheckboxGroup items={items} label="Toppings" />);
    await user.tab();
    expect(box("Basil")).toHaveFocus();
    await user.keyboard(" ");
    expect(box("Basil")).toBeChecked();
    await user.tab();
    expect(box("Olives")).toHaveFocus();
  });

  it("mirrors a controlled selection without reporting, and a re-ordered echo changes nothing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <CheckboxGroup items={items} label="Toppings" value={[]} onValueChange={onValueChange} />,
    );
    rerender(
      <CheckboxGroup
        items={items}
        label="Toppings"
        value={["basil"]}
        onValueChange={onValueChange}
      />,
    );
    expect(box("Basil")).toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(box("Olives"));
    expect(onValueChange).toHaveBeenLastCalledWith(["basil", "olives"]);
    rerender(
      <CheckboxGroup
        items={items}
        label="Toppings"
        value={["olives", "basil"]}
        onValueChange={onValueChange}
      />,
    );
    expect(box("Basil")).toBeChecked();
    expect(box("Olives")).toBeChecked();
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("keeps the user's selection when a parent re-renders with a fresh, equal array", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CheckboxGroup items={items} label="Toppings" value={["basil"]} />);
    await user.click(box("Olives"));
    rerender(<CheckboxGroup items={items} label="Toppings" value={["basil"]} />);
    expect(box("Olives")).toBeChecked();
  });

  it("disables every box when the group is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CheckboxGroup items={items} label="Toppings" disabled onValueChange={onValueChange} />);
    expect(box("Basil")).toBeDisabled();
    await user.click(box("Basil"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("submits every checked item's value under the shared name", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <CheckboxGroup items={items} label="Toppings" name="toppings" value={["basil"]} />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).getAll("toppings")).toEqual(["basil"]);
    await user.click(box("Olives"));
    expect(new FormData(form).getAll("toppings")).toEqual(["basil", "olives"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <CheckboxGroup items={items} label="Toppings" value={["basil"]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
