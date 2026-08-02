import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "./Button";

describe("Vue Button (styled)", () => {
  it("defaults to the default variant", () => {
    render(Button, { slots: { default: () => "Delete" } });
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute(
      "data-variant",
      "default",
    );
  });

  it.each(["default", "primary", "secondary", "ghost", "danger"] as const)(
    "exposes the %s variant",
    (variant) => {
      render(Button, { props: { variant }, slots: { default: () => "Delete" } });
      expect(screen.getByRole("button")).toHaveAttribute("data-variant", variant);
    },
  );

  it("defaults to type=button so it never submits by accident", () => {
    render(Button, { slots: { default: () => "Delete" } });
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("calls onPress and honours disabled", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(Button, {
      props: { onPress },
      slots: { default: () => "Delete" },
    });
    await user.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledOnce();

    await rerender({ disabled: true });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-disabled", "");
    await user.click(button);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("shows the hazard icon on danger so meaning is not colour-only", () => {
    const { container } = render(Button, {
      props: { variant: "danger" },
      slots: { default: () => "Delete" },
    });
    expect(container.querySelector(".button__icon")).toBeInTheDocument();
  });

  it("adds no automatic icon to an icon-only button", () => {
    const { container } = render(Button, {
      props: { iconOnly: true, variant: "danger", ariaLabel: "Delete" },
      slots: { default: () => h("svg") },
    });
    expect(container.querySelector(".button__icon")).toBeNull();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("button--icon-only");
  });

  it("renders a custom leading icon over the built-in glyph", () => {
    render(Button, {
      slots: {
        default: () => "Delete",
        left: () => h("svg", { "data-testid": "custom" }),
      },
    });
    expect(screen.getByTestId("custom")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Button, { slots: { default: () => "Delete" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
