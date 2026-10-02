import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Slider from "./Slider.svelte";

describe("Svelte Slider (styled)", () => {
  it("renders a labelled slider at the right value", () => {
    render(Slider, { props: { value: 25, label: "Brightness" } });
    expect(screen.getByRole<HTMLInputElement>("slider", { name: "Brightness" })).toHaveValue("25");
  });

  it("reports value changes from input", async () => {
    const onValueChange = vi.fn();
    render(Slider, { props: { value: 10, step: 10, label: "Brightness", onValueChange } });
    await fireEvent.input(screen.getByRole("slider"), { target: { value: "20" } });
    expect(onValueChange).toHaveBeenLastCalledWith(20);
  });

  it("accepts input once a slider mounted disabled is enabled", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(Slider, {
      props: { value: 10, disabled: true, label: "Brightness", onValueChange },
    });
    await rerender({ disabled: false });
    await fireEvent.input(screen.getByRole("slider"), { target: { value: "30" } });
    expect(onValueChange).toHaveBeenLastCalledWith(30);
  });

  it("follows bounds changed after mount", async () => {
    const { container, rerender } = render(Slider, {
      props: { value: 50, max: 100, label: "Brightness" },
    });
    await rerender({ max: 200 });
    const track = container.querySelector<HTMLElement>(".slider");
    expect(track?.style.getPropertyValue("--_slider-pct")).toBe("25%");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Slider, { props: { value: 50, label: "Brightness" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
