import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./slider.fixture.svelte";

// Built on a native <input type="range">: the slider role, ARIA value and
// keyboard control are the browser's job (jsdom doesn't move a range on arrow
// keys — that's covered by E2E). We simulate the browser's `input` event to
// cover the wiring we own (snapping + change reporting).
describe("Svelte Slider (native range)", () => {
  it("exposes a labelled slider at the right value", () => {
    render(Fixture, { props: { value: 40 } });
    const slider = screen.getByRole<HTMLInputElement>("slider", { name: "Volume" });
    expect(slider).toHaveValue("40");
  });

  it("reports snapped value changes from input", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: 50, step: 5, onValueChange } });
    const slider = screen.getByRole<HTMLInputElement>("slider");

    await fireEvent.input(slider, { target: { value: "55" } });
    expect(onValueChange).toHaveBeenLastCalledWith(55);
    expect(slider).toHaveValue("55");
  });

  it("does not change when disabled", async () => {
    const onValueChange = vi.fn();
    render(Fixture, { props: { value: 30, disabled: true, onValueChange } });
    const slider = screen.getByRole<HTMLInputElement>("slider");
    expect(slider).toBeDisabled();

    await fireEvent.input(slider, { target: { value: "80" } });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: 60 } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
