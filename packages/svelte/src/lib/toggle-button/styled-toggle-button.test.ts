import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-toggle-button.fixture.svelte";
import FormFixture from "./form-toggle-button.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

/** Reset resolves one task after the event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Svelte ToggleButton (styled)", () => {
  it("renders a native button with the off state", () => {
    render(Fixture);
    const toggle = screen.getByRole("button", { name: "Bold", pressed: false });
    expect(toggle).toHaveAttribute("type", "button");
    expect(toggle).toHaveClass("toggle");
    expect(toggle).toHaveAttribute("data-state", "off");
  });

  it("toggles on press and reports the change", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(Fixture, { props: { onPressedChange } });
    const toggle = screen.getByRole("button", { name: "Bold" });

    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Bold", pressed: true })).toBe(toggle);
    expect(toggle).toHaveAttribute("data-state", "on");
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it("toggles with Enter and Space", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const toggle = screen.getByRole("button", { name: "Bold" });
    toggle.focus();

    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the same name in both states", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { check: true } });
    expect(screen.getByRole("button", { name: "Bold", pressed: false })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bold" }));
    // Only aria-pressed changes; the check glyph is hidden from the name.
    expect(screen.getByRole("button", { name: "Bold", pressed: true })).toBeInTheDocument();
    expect(document.querySelector(".toggle__check")).not.toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { pressed: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

// Form participation is provisional: a hidden input sends name=value while
// the button is pressed and enabled.
describe("Svelte ToggleButton (form)", () => {
  const form = () => screen.getByRole("form", { name: "Formatting" }) as HTMLFormElement;
  const toggle = () => screen.getByRole("button", { name: "Bold" });

  it("submits the value only while pressed", async () => {
    const user = userEvent.setup();
    render(FormFixture);
    expect(new FormData(form()).get("bold")).toBeNull();

    await user.click(toggle());
    expect(new FormData(form()).get("bold")).toBe("yes");

    await user.click(toggle());
    expect(new FormData(form()).get("bold")).toBeNull();
  });

  it("is not submitted while disabled", () => {
    render(FormFixture, { props: { pressed: true, disabled: true } });
    expect(new FormData(form()).get("bold")).toBeNull();
  });

  it("restores the default pressed value on reset, reporting nothing", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(FormFixture, { props: { pressed: true, onPressedChange } });

    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).toHaveBeenCalledTimes(1);

    form().reset();
    await settled();
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(new FormData(form()).get("bold")).toBe("yes");
    expect(onPressedChange).toHaveBeenCalledTimes(1);
  });

  it("restores through the reset button too", async () => {
    const user = userEvent.setup();
    render(FormFixture);

    await user.click(toggle());
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await settled();
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
  });
});

// The pressed prop is controlled: a new value from the parent shows without
// a report; an unchanged prop keeps what the user did.
describe("Svelte ToggleButton (controlled and uncontrolled)", () => {
  const toggle = () => screen.getByRole("button", { name: "Bold" });

  it("follows a pressed prop the parent changes, without reporting", async () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { onPressedChange } });

    await rerender({ pressed: true, onPressedChange });
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("keeps the user's value when the prop does not change", async () => {
    const user = userEvent.setup();
    const { rerender } = render(Fixture);

    await user.click(toggle());
    await rerender({ disabled: false });
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
  });
});

// The disabled prop is controlled: a consumer can turn a control off and on
// again while it is on screen.
describe("Svelte ToggleButton (disabled after mount)", () => {
  const toggle = () => screen.getByRole("button", { name: "Bold" });

  it("disables the native button when the prop turns on", async () => {
    const { rerender } = render(Fixture);
    expect(toggle()).toBeEnabled();

    await rerender({ disabled: true });
    expect(toggle()).toBeDisabled();
    expect(toggle()).toHaveAttribute("data-disabled", "");
  });

  it("keeps the pressed value while disabled and reports nothing", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { pressed: true, onPressedChange } });

    await rerender({ pressed: true, disabled: true, onPressedChange });
    expect(toggle()).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("restores pointer and keyboard activation when the prop turns off", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { disabled: true, onPressedChange } });

    await rerender({ disabled: false, onPressedChange });
    await user.click(toggle());
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).toHaveBeenLastCalledWith(true);

    await user.keyboard(" ");
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it("accepts a new pressed value in the same update that re-enables it", async () => {
    const { rerender } = render(Fixture, { props: { disabled: true } });
    await rerender({ disabled: false, pressed: true });

    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(toggle()).toHaveAttribute("data-state", "on");
  });
});
