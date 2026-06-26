import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./toolbar.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Toolbar", () => {
  it("renders a named toolbar containing its controls", () => {
    render(Fixture);
    const toolbar = screen.getByRole("toolbar", { name: "Text formatting" });
    expect(toolbar).toHaveAttribute("aria-orientation", "horizontal");
    expect(screen.getByRole("button", { name: "Bold", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Align left" })).toBeInTheDocument();
  });

  it("exposes a single tab stop (roving tabindex)", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Align left" })).toHaveAttribute("tabindex", "-1");
  });

  it("moves focus with the arrow keys and wraps, updating the tab stop", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const bold = screen.getByRole("button", { name: "Bold" });
    const italic = screen.getByRole("button", { name: "Italic" });
    const alignLeft = screen.getByRole("button", { name: "Align left" });

    bold.focus();
    await user.keyboard("{ArrowRight}");
    expect(italic).toHaveFocus();
    expect(italic).toHaveAttribute("tabindex", "0");
    expect(bold).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{End}");
    expect(alignLeft).toHaveFocus();
    await user.keyboard("{ArrowRight}"); // wraps to first
    expect(bold).toHaveFocus();
    await user.keyboard("{Home}");
    expect(bold).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
