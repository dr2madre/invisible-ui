import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PinInput } from "./PinInput";

const cells = () => screen.getAllByRole<HTMLInputElement>("textbox");

describe("React PinInput", () => {
  it("renders a labelled group of cells, each named from the catalog", () => {
    render(<PinInput label="Verification code" length={4} />);
    expect(screen.getByRole("group", { name: "Verification code" })).toBeInTheDocument();
    expect(cells()).toHaveLength(4);
    expect(screen.getByRole("textbox", { name: "Character 1 of 4" })).toHaveAttribute(
      "autocomplete",
      "one-time-code",
    );
    expect(cells()[0]).toHaveAttribute("inputmode", "numeric");
  });

  it("fills a cell on input, advances focus, and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PinInput label="Verification code" length={4} onValueChange={onValueChange} />);
    await user.click(cells()[0]!);
    await user.keyboard("1");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith("1");
    expect(cells()[0]).toHaveValue("1");
    expect(cells()[1]).toHaveFocus();
  });

  it("ignores characters outside the numeric type", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PinInput label="Verification code" length={4} onValueChange={onValueChange} />);
    await user.click(cells()[0]!);
    await user.keyboard("a");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(cells()[0]).toHaveValue("");
  });

  it("clears with Backspace and steps back when empty", async () => {
    const user = userEvent.setup();
    render(<PinInput label="Verification code" length={4} value="12" />);
    await user.click(cells()[2]!);
    await user.keyboard("{Backspace}");
    expect(cells()[1]).toHaveFocus();
    expect(cells()[1]).toHaveValue("");
  });

  it("moves between cells with the arrows, Home and End", async () => {
    const user = userEvent.setup();
    render(<PinInput label="Verification code" length={4} />);
    await user.click(cells()[1]!);
    await user.keyboard("{ArrowRight}");
    expect(cells()[2]).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(cells()[0]).toHaveFocus();
    await user.keyboard("{End}");
    expect(cells()[3]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(cells()[0]).toHaveFocus();
  });

  it("distributes a pasted code across the cells and completes once", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<PinInput label="Verification code" length={4} onComplete={onComplete} />);
    await user.click(cells()[0]!);
    await user.paste("1234");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("1234");
    expect(cells()[3]).toHaveValue("4");
  });

  it("mirrors a controlled code without reporting, and re-spreads it on a new length", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <PinInput label="Code" length={4} value="12" onValueChange={onValueChange} />,
    );
    rerender(<PinInput label="Code" length={4} value="9876" onValueChange={onValueChange} />);
    expect(cells().map((cell) => cell.value)).toEqual(["9", "8", "7", "6"]);
    rerender(<PinInput label="Code" length={6} value="9876" onValueChange={onValueChange} />);
    expect(cells().map((cell) => cell.value)).toEqual(["9", "8", "7", "6", "", ""]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("masks the cells and marks the validation state", () => {
    const { container, rerender } = render(<PinInput label="Code" length={2} mask invalid />);
    expect(container.querySelectorAll('input[type="password"]')).toHaveLength(2);
    expect(container.querySelector(".pin-input")).toHaveAttribute("data-invalid");
    expect(container.querySelector('input[type="password"]')).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    rerender(<PinInput label="Code" length={2} success />);
    expect(container.querySelector(".pin-input")).toHaveAttribute("data-success");
  });

  it("submits the combined code under the field name, and nothing while disabled", () => {
    const { rerender } = render(
      <form data-testid="form">
        <PinInput label="Code" length={4} name="code" value="1234" />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("code")).toBe("1234");
    rerender(
      <form data-testid="form">
        <PinInput label="Code" length={4} name="code" value="1234" disabled />
      </form>,
    );
    expect(new FormData(form).has("code")).toBe(false);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<PinInput label="Verification code" length={4} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
