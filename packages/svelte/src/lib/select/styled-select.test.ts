import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Select from "./Select.svelte";

const items = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar" },
];

describe("Svelte Select (styled)", () => {
  it("shows the placeholder until a value is chosen", () => {
    render(Select, { props: { label: "View", items, placeholder: "Pick a view" } });
    const trigger = screen.getByRole("combobox", { name: /View/ });
    expect(trigger).toHaveTextContent("Pick a view");
  });

  it("renders the selected option's label on the trigger", () => {
    render(Select, { props: { label: "View", items, value: "board" } });
    expect(screen.getByRole("combobox", { name: /View/ })).toHaveTextContent("Board");
  });

  it("updates the trigger and hidden input when the controlled value changes", async () => {
    const { rerender } = render(Select, {
      props: { label: "View", items, value: "list", name: "view", placeholder: "Pick a view" },
    });
    const trigger = screen.getByRole("combobox", { name: /View/ });
    const input = document.querySelector<HTMLInputElement>('input[name="view"]');

    expect(trigger).toHaveTextContent("List");
    expect(input).toHaveValue("list");

    await rerender({
      label: "View",
      items,
      value: "calendar",
      name: "view",
      placeholder: "Pick a view",
    });
    expect(trigger).toHaveTextContent("Calendar");
    expect(input).toHaveValue("calendar");

    await rerender({
      label: "View",
      items,
      value: null,
      name: "view",
      placeholder: "Pick a view",
    });
    expect(trigger).toHaveTextContent("Pick a view");
    expect(input).toHaveValue("");
  });

  it("opens, selects an option, and updates the trigger text", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Select, { props: { label: "View", items, onValueChange } });
    const trigger = screen.getByRole("combobox", { name: /View/ });

    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Calendar" }));
    expect(onValueChange).toHaveBeenCalledWith("calendar");
    expect(trigger).toHaveTextContent("Calendar");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("honors disabled after rerender", async () => {
    const user = userEvent.setup();
    const { rerender } = render(Select, {
      props: { label: "View", items, onValueChange: vi.fn() },
    });
    const trigger = screen.getByRole("combobox", { name: /View/ });

    await rerender({ label: "View", items, disabled: true });
    expect(trigger).toHaveAttribute("aria-disabled", "true");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("announces required and invalid states with the error message", () => {
    render(Select, {
      props: { label: "View", items, required: true, error: "Pick a view to continue" },
    });
    const trigger = screen.getByRole("combobox", { name: /View/ });
    expect(trigger).toHaveAttribute("aria-required", "true");
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription("Pick a view to continue");
  });

  it("notifies open state changes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Select, { props: { label: "View", items, onOpenChange } });
    await user.click(screen.getByRole("combobox", { name: /View/ }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(Select, { props: { label: "View", items, value: "list" } });
    await user.click(screen.getByRole("combobox", { name: /View/ }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
