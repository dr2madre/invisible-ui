import { fireEvent, screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import type { DsSlider } from "./ds-slider";

// Built on a native <input type="range">: the slider role, ARIA value and
// keyboard are the browser's job (jsdom moves no range on arrow keys; the
// browser specs cover that). The browser's `input` event is simulated to cover
// the wiring the element owns: snapping, reporting and the form contract.

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-slider") as DsSlider;
};
const control = () => screen.getByRole<HTMLInputElement>("slider");
const move = (value: string) => fireEvent.input(control(), { target: { value } });

describe("<ds-slider>", () => {
  it("exposes a labelled native slider at the right value", () => {
    mount(`<ds-slider label="Volume" value="40"></ds-slider>`);
    const slider = screen.getByRole<HTMLInputElement>("slider", { name: "Volume" });
    expect(slider.type).toBe("range");
    expect(slider).toHaveValue("40");
    expect(slider).toHaveAttribute("aria-orientation", "horizontal");
    expect(
      document.querySelector<HTMLElement>(".slider")!.style.getPropertyValue("--_slider-pct"),
    ).toBe("40%");
  });

  it("reports snapped value changes from input and reflects them", () => {
    const host = mount(`<ds-slider label="Volume" value="50" step="5"></ds-slider>`);
    const seen: number[] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.value));

    move("55");

    expect(seen).toEqual([55]);
    expect(host.value).toBe(55);
    expect(host).toHaveAttribute("value", "55");
    expect(control()).toHaveValue("55");
  });

  it("does not change when disabled", () => {
    const host = mount(`<ds-slider label="Volume" value="30" disabled></ds-slider>`);
    const onChange = vi.fn();
    host.addEventListener("change", onChange);
    expect(control()).toBeDisabled();

    move("80");
    expect(onChange).not.toHaveBeenCalled();
    expect(host.value).toBe(30);
  });

  it("snaps an off-grid value onto the step", () => {
    const host = mount(`<ds-slider label="Volume" value="33" step="5"></ds-slider>`);
    expect(control()).toHaveValue("35");
    expect(host.value).toBe(35);
  });

  it("reflects a value set by the page without reporting it", () => {
    const host = mount(`<ds-slider label="Volume" value="20"></ds-slider>`);
    const onChange = vi.fn();
    host.addEventListener("change", onChange);

    host.value = 60;
    expect(control()).toHaveValue("60");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves the value onto a new grid when a constraint changes", () => {
    const host = mount(`<ds-slider label="Volume" value="80"></ds-slider>`);
    host.setAttribute("max", "50");
    expect(control()).toHaveAttribute("max", "50");
    expect(control()).toHaveValue("50");
    expect(host.value).toBe(50);
  });

  it("shows the value and the range through the format property", () => {
    const host = mount(`<ds-slider label="Volume" value="40" show-value show-range></ds-slider>`);
    host.format = (value) => `${value}%`;
    expect(document.querySelector(".slider-field__value")).toHaveTextContent("40%");
    const range = document.querySelector(".slider-field__range")!;
    expect(range).toHaveAttribute("aria-hidden", "true");
    expect(range).toHaveTextContent("0%100%");

    host.removeAttribute("show-value");
    expect(document.querySelector(".slider-field__value")).toBeNull();
  });

  it("draws one tick per step only while the count stays readable", () => {
    const host = mount(`<ds-slider label="Volume" step="10" ticks></ds-slider>`);
    const ticks = document.querySelectorAll<HTMLElement>(".slider__tick");
    expect(ticks).toHaveLength(11);
    expect(ticks[5]!.style.insetInlineStart).toBe("50%");

    host.setAttribute("step", "1");
    expect(document.querySelectorAll(".slider__tick")).toHaveLength(0);
  });

  it("moves a slot=icon child into the leading icon", () => {
    mount(`<ds-slider label="Volume"><svg slot="icon" data-testid="glyph"></svg></ds-slider>`);
    const glyph = screen.getByTestId("glyph");
    expect(glyph.parentElement).toHaveClass("slider-field__icon");
    expect(glyph).not.toHaveAttribute("slot");
  });

  it("the vertical orientation reaches the input and the track", () => {
    const host = mount(`<ds-slider label="Volume"></ds-slider>`);
    host.setAttribute("orientation", "vertical");
    expect(control()).toHaveAttribute("aria-orientation", "vertical");
    expect(document.querySelector(".slider")).toHaveAttribute("data-orientation", "vertical");
  });

  it("the label attribute drives the accessible name after the first render", () => {
    const host = mount(`<ds-slider label="Volume"></ds-slider>`);
    host.setAttribute("label", "Brightness");
    expect(screen.getByRole("slider", { name: "Brightness" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-slider label="Volume" value="60" show-value></ds-slider>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-slider> in a native form", () => {
  it("submits the current value under the field name", () => {
    document.body.innerHTML = `<form><ds-slider label="Volume" name="volume" value="30"></ds-slider></form>`;
    const form = document.querySelector("form")!;
    expect(new FormData(form).get("volume")).toBe("30");

    move("70");
    expect(new FormData(form).get("volume")).toBe("70");
  });

  it("leaves the form when disabled", () => {
    document.body.innerHTML = `<form><ds-slider label="Volume" name="volume" disabled></ds-slider></form>`;
    expect([...new FormData(document.querySelector("form")!).keys()]).toEqual([]);
  });
});
