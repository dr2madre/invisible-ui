import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import CloseButton from "./CloseButton.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("CloseButton", () => {
  it("renders a native button with a default accessible name", () => {
    render(CloseButton);
    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toBeDisabled();
  });

  it("accepts a custom label", () => {
    render(CloseButton, { props: { label: "Dismiss notice" } });
    expect(screen.getByRole("button", { name: "Dismiss notice" })).toBeInTheDocument();
  });

  it("hides the icon from assistive tech", () => {
    const { container } = render(CloseButton);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("calls onclose when activated", async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    render(CloseButton, { props: { onclose } });
    await user.click(screen.getByRole("button"));
    expect(onclose).toHaveBeenCalledOnce();
  });

  it("does not call onclose when disabled", async () => {
    const user = userEvent.setup();
    const onclose = vi.fn();
    render(CloseButton, { props: { disabled: true, onclose } });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onclose).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(CloseButton, { props: { label: "Close" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
