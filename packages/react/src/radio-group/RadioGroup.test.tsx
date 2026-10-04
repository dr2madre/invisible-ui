import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { RadioGroup } from "./RadioGroup";

const items = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large", disabled: true },
];

describe("React RadioGroup (styled)", () => {
  it("renders a named group with the selected item checked", () => {
    render(<RadioGroup items={items} label="Size" value="medium" />);
    const group = screen.getByRole("radiogroup", { name: "Size" });
    expect(group).toHaveAttribute("aria-orientation", "vertical");
    const medium = screen.getByRole("radio", { name: "Medium" });
    expect(medium).toBeChecked();
    expect(medium).toHaveAttribute("data-state", "checked");
  });

  it("radios share a single generated group name", () => {
    render(<RadioGroup items={items} label="Size" />);
    const names = new Set(screen.getAllByRole<HTMLInputElement>("radio").map((r) => r.name));
    expect(names.size).toBe(1);
    expect([...names][0]).not.toBe("");
  });

  it("selects on click and reports the change once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioGroup items={items} label="Size" onValueChange={onValueChange} />);
    await user.click(screen.getByRole("radio", { name: "Medium" }));
    expect(screen.getByRole("radio", { name: "Medium" })).toBeChecked();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("medium");
  });

  it("moves the selection with the arrow keys, skipping a disabled item", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup
        items={[...items, { value: "huge", label: "Huge" }]}
        label="Size"
        value="small"
        onValueChange={onValueChange}
      />,
    );
    await user.tab();
    expect(screen.getByRole("radio", { name: "Small" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("medium");
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("huge");
    expect(screen.getByRole("radio", { name: "Huge" })).toHaveFocus();
  });

  it("falls back to the value when no label is given", () => {
    render(<RadioGroup items={[{ value: "x" }]} label="Letters" />);
    expect(screen.getByRole("radio", { name: "x" })).toBeInTheDocument();
  });

  it("supports a horizontal orientation", () => {
    render(<RadioGroup items={items} label="Size" orientation="horizontal" />);
    const group = screen.getByRole("radiogroup", { name: "Size" });
    expect(group).toHaveAttribute("aria-orientation", "horizontal");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
  });

  it("mirrors an externally controlled value without reporting", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <RadioGroup items={items} label="Size" value="small" onValueChange={onValueChange} />,
    );
    rerender(
      <RadioGroup items={items} label="Size" value="medium" onValueChange={onValueChange} />,
    );
    expect(screen.getByRole("radio", { name: "Medium" })).toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("honours a callback replaced after mount", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<RadioGroup items={items} label="Size" onValueChange={first} />);
    rerender(<RadioGroup items={items} label="Size" onValueChange={second} />);
    await user.click(screen.getByRole("radio", { name: "Small" }));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("small");
  });

  it("is inert when the group is disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioGroup items={items} label="Size" disabled onValueChange={onValueChange} />);
    const radio = screen.getByRole("radio", { name: "Small" });
    expect(radio).toBeDisabled();
    await user.click(radio);
    expect(radio).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("submits the selected value under the group name, nothing until a choice is made", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <RadioGroup items={items} label="Size" name="size" />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("size")).toBeNull();
    await user.click(screen.getByRole("radio", { name: "Small" }));
    expect(new FormData(form).get("size")).toBe("small");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<RadioGroup items={items} label="Size" value="small" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
