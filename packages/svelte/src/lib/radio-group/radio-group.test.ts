import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./radio-group.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

// Built on native <input type="radio">: single selection, roving tabindex and
// arrow-key navigation are the browser's job (and covered by E2E in a real
// browser — jsdom doesn't implement radio keyboard nav). These tests cover the
// wiring we own: rendering, selection, disabled and accessibility.
describe("Svelte RadioGroup (native)", () => {
  it("renders a radiogroup with radios", () => {
    render(Fixture);
    expect(screen.getByRole("radiogroup", { name: "Size" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("radios share a single group name", () => {
    render(Fixture);
    const radios = screen.getAllByRole<HTMLInputElement>("radio");
    const names = new Set(radios.map((r) => r.name));
    expect(names.size).toBe(1);
  });

  it("selects on click", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const medium = screen.getByRole("radio", { name: "medium" });
    await user.click(medium);
    expect(medium).toBeChecked();
  });

  it("reflects the preselected value", () => {
    render(Fixture, { props: { value: "small" } });
    expect(screen.getByRole("radio", { name: "small" })).toBeChecked();
  });

  it("is inert when the group is disabled", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { disabled: true } });
    const radio = screen.getByRole("radio", { name: "small" });
    expect(radio).toBeDisabled();
    await user.click(radio);
    expect(radio).not.toBeChecked();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: "small" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
