import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "./Button";

describe("React Button (styled)", () => {
  it("defaults to the default variant", () => {
    render(<Button>Delete</Button>);
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute(
      "data-variant",
      "default",
    );
  });

  it.each(["default", "primary", "secondary", "ghost", "danger"] as const)(
    "exposes the %s variant",
    (variant) => {
      render(<Button variant={variant}>Delete</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("data-variant", variant);
    },
  );

  it("defaults to type=button so it never submits by accident", () => {
    render(<Button>Delete</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("calls onPress and honours disabled", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(<Button onPress={onPress}>Delete</Button>);
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledOnce();

    rerender(
      <Button disabled onPress={onPress}>
        Delete
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-disabled", "");
    await user.click(button);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("shows the hazard icon on danger so meaning is not colour-only", () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.querySelector(".button__icon")).toBeInTheDocument();
  });

  it("adds no automatic icon to an icon-only button", () => {
    const { container } = render(
      <Button iconOnly variant="danger" ariaLabel="Delete">
        <svg />
      </Button>,
    );
    expect(container.querySelector(".button__icon")).toBeNull();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("button--icon-only");
  });

  it("renders a custom leading icon over the built-in glyph", () => {
    render(<Button left={<svg data-testid="custom" />}>Delete</Button>);
    expect(screen.getByTestId("custom")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Button>Delete</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("warns about a missing name once per button, not on every render", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const glyph = <svg aria-hidden="true" />;
    const { rerender } = render(
      <StrictMode>
        <Button iconOnly>{glyph}</Button>
      </StrictMode>,
    );
    for (const variant of ["primary", "ghost", "danger"] as const) {
      rerender(
        <StrictMode>
          <Button iconOnly variant={variant}>
            {glyph}
          </Button>
        </StrictMode>,
      );
    }
    const calls = warn.mock.calls.filter((call) => String(call[0]).includes("no accessible name"));
    warn.mockRestore();
    expect(calls).toHaveLength(1);
  });

  it("stays quiet about a button that has a name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Button iconOnly ariaLabel="Add">
        <svg aria-hidden="true" />
      </Button>,
    );
    const calls = warn.mock.calls.length;
    warn.mockRestore();
    expect(calls).toBe(0);
  });
});
