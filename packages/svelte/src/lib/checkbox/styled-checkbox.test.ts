import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-checkbox.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Checkbox (styled)", () => {
  it("renders an accessible checkbox labelled by its visible text", () => {
    render(Fixture);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox).toHaveAttribute("data-state", "unchecked");
  });

  it("reflects the checked state via data-state and reports changes", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Fixture, { props: { onCheckedChange } });
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("data-state", "checked");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("renders the indeterminate state", () => {
    render(Fixture, { props: { checked: "indeterminate" } });
    expect(screen.getByRole("checkbox")).toHaveAttribute("data-state", "indeterminate");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { checked: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
