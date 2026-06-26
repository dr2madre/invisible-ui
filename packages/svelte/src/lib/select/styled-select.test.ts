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

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(Select, { props: { label: "View", items, value: "list" } });
    await user.click(screen.getByRole("combobox", { name: /View/ }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
