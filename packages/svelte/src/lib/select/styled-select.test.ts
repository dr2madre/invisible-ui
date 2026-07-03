import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Select from "./Select.svelte";

const items = [
  { value: "list", label: "List" },
  { value: "board", label: "Board" },
  { value: "calendar", label: "Calendar", disabled: true },
];

describe("Svelte Select (styled, native)", () => {
  it("renders a labelled native select showing the placeholder", () => {
    render(Select, { props: { label: "View", items, placeholder: "Pick a view" } });
    const select = screen.getByRole("combobox", { name: "View" });
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveValue("");
    // The placeholder option is hidden from the popup (and the a11y tree).
    const placeholder = select.querySelector<HTMLOptionElement>('option[value=""]')!;
    expect(placeholder).toHaveTextContent("Pick a view");
    expect(placeholder).toBeDisabled();
  });

  it("selects natively and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Select, { props: { label: "View", items, onValueChange } });
    await user.selectOptions(screen.getByRole("combobox", { name: "View" }), "board");
    expect(onValueChange).toHaveBeenCalledWith("board");
    expect(screen.getByRole("combobox", { name: "View" })).toHaveValue("board");
  });

  it("reflects a controlled value and disabled options", async () => {
    const { rerender } = render(Select, { props: { label: "View", items, value: "list" } });
    expect(screen.getByRole("combobox", { name: "View" })).toHaveValue("list");
    await rerender({ value: "board" });
    expect(screen.getByRole("combobox", { name: "View" })).toHaveValue("board");
    expect(screen.getByRole("option", { name: "Calendar" })).toBeDisabled();
  });

  it("submits its value with the form under `name`", async () => {
    const user = userEvent.setup();
    const { container } = render(Select, { props: { label: "View", items, name: "view" } });
    const form = document.createElement("form");
    container.querySelector(".select")!.closest("body")!.appendChild(form);
    form.appendChild(container.firstElementChild!);
    await user.selectOptions(screen.getByRole("combobox", { name: "View" }), "list");
    expect(new FormData(form).get("view")).toBe("list");
  });

  it("honours disabled", () => {
    render(Select, { props: { label: "View", items, disabled: true } });
    expect(screen.getByRole("combobox", { name: "View" })).toBeDisabled();
  });

  it("announces required and invalid states with the error message", () => {
    render(Select, {
      props: { label: "View", items, required: true, error: "Pick a view to continue" },
    });
    const select = screen.getByRole("combobox", { name: "View" });
    expect(select).toBeRequired();
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Pick a view to continue");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Select, {
      props: { label: "View", items, value: "list" },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
