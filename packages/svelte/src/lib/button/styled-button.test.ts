import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-button.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Button (styled)", () => {
  it("defaults to the default variant", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute(
      "data-variant",
      "default",
    );
  });

  it.each(["default", "primary", "secondary", "ghost", "danger"] as const)(
    "exposes the %s variant",
    (variant) => {
      render(Fixture, { props: { variant } });
      expect(screen.getByRole("button")).toHaveAttribute("data-variant", variant);
    },
  );

  it("calls onpress and honours disabled", async () => {
    const user = userEvent.setup();
    const onpress = vi.fn();
    const { rerender } = render(Fixture, { props: { onpress } });
    await user.click(screen.getByRole("button"));
    expect(onpress).toHaveBeenCalledOnce();

    await rerender({ disabled: true, onpress });
    expect(screen.getByRole("button")).toBeDisabled();
    await user.click(screen.getByRole("button"));
    expect(onpress).toHaveBeenCalledOnce();
  });

  it("announces loading, shows the spinner and ignores presses", async () => {
    const user = userEvent.setup();
    const onpress = vi.fn();
    render(Fixture, { props: { loading: true, onpress } });
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).not.toBeDisabled();
    expect(button.querySelector(".loading__spinner")).not.toBeNull();
    await user.click(button);
    expect(onpress).not.toHaveBeenCalled();
  });

  it("shows no icons by default for primary", () => {
    const { container } = render(Fixture, { props: { variant: "primary" } });
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("shows a hazard icon by default for danger", () => {
    const { container } = render(Fixture, { props: { variant: "danger" } });
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("can opt out of the danger icon", () => {
    const { container } = render(Fixture, { props: { variant: "danger", leftIcon: false } });
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("adds leading and trailing plus icons on request", () => {
    const { container } = render(Fixture, {
      props: { variant: "primary", leftIcon: true, rightIcon: true },
    });
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { variant: "danger" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
