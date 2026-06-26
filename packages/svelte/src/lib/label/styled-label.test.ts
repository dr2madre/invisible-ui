import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-label.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte Label (styled)", () => {
  it("labels the control and focuses it on click", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const input = screen.getByLabelText("Full name");
    expect(input).toHaveAttribute("id", "name");

    await user.click(screen.getByText("Full name"));
    expect(input).toHaveFocus();
  });

  it("shows a required marker hidden from assistive tech", () => {
    const { container } = render(Fixture, { props: { required: true } });
    const marker = screen.getByText("*");
    expect(marker).toHaveAttribute("aria-hidden", "true");
    // The association still holds with the marker present.
    const label = container.querySelector("label.label")!;
    expect(label).toHaveAttribute("for", "name");
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "name");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { required: true } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
