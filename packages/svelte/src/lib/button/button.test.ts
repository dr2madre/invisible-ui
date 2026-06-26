import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import ButtonFixture from "./button.fixture.svelte";
import LinkButtonFixture from "./link-button.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Button (native)", () => {
  it("renders a type=button with an accessible name", () => {
    render(ButtonFixture);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toBeDisabled();
  });

  it("calls onPress on click", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(ButtonFixture, { props: { onPress } });
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("does not call onPress when disabled", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(ButtonFixture, { props: { disabled: true, onPress } });
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-disabled", "");
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(ButtonFixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

describe("Svelte Button (non-native element)", () => {
  it("exposes the button role and is focusable", () => {
    render(LinkButtonFixture);
    const button = screen.getByRole("button", { name: "Open" });
    expect(button).toHaveAttribute("tabindex", "0");
  });

  it("activates on click", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(LinkButtonFixture, { props: { onPress } });
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("activates on Enter", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(LinkButtonFixture, { props: { onPress } });
    screen.getByRole("button", { name: "Open" }).focus();
    await user.keyboard("{Enter}");
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("activates on Space", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(LinkButtonFixture, { props: { onPress } });
    screen.getByRole("button", { name: "Open" }).focus();
    await user.keyboard(" ");
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("is not focusable and ignores activation when disabled", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(LinkButtonFixture, { props: { disabled: true, onPress } });
    const button = screen.getByRole("button", { name: "Open" });

    expect(button).not.toHaveAttribute("tabindex");
    expect(button).toHaveAttribute("aria-disabled", "true");
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(LinkButtonFixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
