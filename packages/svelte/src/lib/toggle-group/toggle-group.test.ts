import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./toggle-group.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte ToggleGroup", () => {
  it("renders toggle buttons in a labelled group, none pressed", () => {
    render(Fixture);
    const group = screen.getByRole("group", { name: "Text formatting" });
    expect(group).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("presses on click and (single) releases the previous", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { value: ["bold"] } });
    await user.click(screen.getByRole("button", { name: "underline" }));
    expect(screen.getByRole("button", { name: "bold" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "underline" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("multiple: buttons press independently", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { type: "multiple" } });
    await user.click(screen.getByRole("button", { name: "bold" }));
    await user.click(screen.getByRole("button", { name: "underline" }));
    expect(screen.getByRole("button", { name: "bold" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "underline" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("moves focus between buttons with arrow keys", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const [bold, italic] = screen.getAllByRole("button");
    bold.focus();
    await user.keyboard("{ArrowRight}");
    expect(italic).toHaveFocus();
    await user.keyboard("{Home}");
    expect(bold).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: ["bold"] } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
