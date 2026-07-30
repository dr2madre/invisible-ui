import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Checkbox } from "./Checkbox";

const input = () => screen.getByRole("checkbox") as HTMLInputElement;

describe("React Checkbox (styled)", () => {
  it("is a native checkbox named by its label", () => {
    render(<Checkbox label="Subscribe" />);
    const el = screen.getByRole("checkbox", { name: "Subscribe" });
    expect(el.tagName).toBe("INPUT");
    expect(el).toHaveAttribute("type", "checkbox");
    expect(el).toHaveAttribute("data-state", "unchecked");
  });

  it("toggles on press and reports the new value", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Subscribe" onCheckedChange={onCheckedChange} />);

    await user.click(input());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(input()).toBeChecked();
    expect(input()).toHaveAttribute("data-state", "checked");
  });

  it("toggles with the Space key (native behaviour)", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Subscribe" />);
    input().focus();
    await user.keyboard(" ");
    expect(input()).toBeChecked();
  });

  it("pressing the visible label toggles it", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Subscribe" />);
    await user.click(screen.getByText("Subscribe"));
    expect(input()).toBeChecked();
  });

  it("renders the indeterminate state as a DOM property", () => {
    render(<Checkbox label="Subscribe" checked="indeterminate" />);
    expect(input().indeterminate).toBe(true);
    expect(input()).not.toBeChecked();
    expect(input()).toHaveAttribute("data-state", "indeterminate");
  });

  it("advances from indeterminate to checked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox label="Subscribe" checked="indeterminate" onCheckedChange={onCheckedChange} />,
    );
    await user.click(input());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("mirrors an externally controlled value", () => {
    const { rerender } = render(<Checkbox label="Subscribe" checked={false} />);
    expect(input()).not.toBeChecked();
    rerender(<Checkbox label="Subscribe" checked={true} />);
    expect(input()).toBeChecked();
  });

  it("ignores presses when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Subscribe" disabled onCheckedChange={onCheckedChange} />);
    expect(input()).toBeDisabled();
    await user.click(input());
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("participates in a form with name and value", () => {
    render(<Checkbox label="Subscribe" name="news" value="weekly" checked />);
    expect(input()).toHaveAttribute("name", "news");
    expect(input()).toHaveAttribute("value", "weekly");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Checkbox label="Subscribe" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
