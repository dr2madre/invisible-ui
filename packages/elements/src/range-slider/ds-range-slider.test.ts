import { fireEvent, screen } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import type { DsRangeSlider } from "./ds-range-slider";

const lower = () => screen.getByRole<HTMLInputElement>("slider", { name: "Minimum price" });
const upper = () => screen.getByRole<HTMLInputElement>("slider", { name: "Maximum price" });
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

const mount = (attributes = "") => {
  document.body.innerHTML = `<form data-testid="form"><ds-range-slider label="Price"
    lower-label="Minimum price" upper-label="Maximum price" ${attributes}></ds-range-slider></form>`;
  const host = document.querySelector("ds-range-slider") as DsRangeSlider;
  const changes: (readonly [number, number])[] = [];
  host.addEventListener("change", (event) => changes.push((event as CustomEvent).detail.value));
  return { host, changes, form: screen.getByTestId("form") as HTMLFormElement };
};
const move = (thumb: HTMLInputElement, value: string) =>
  fireEvent.input(thumb, { target: { value } });
const fillPercentages = () => {
  const root = document.querySelector(".range-slider") as HTMLElement;
  return [
    root.style.getPropertyValue("--_range-lower-pct"),
    root.style.getPropertyValue("--_range-upper-pct"),
  ];
};

describe("<ds-range-slider>", () => {
  it("renders a named group with both thumbs, lower first in DOM order", () => {
    mount(`value="20,80"`);
    expect(screen.getByRole("group", { name: "Price" })).toBeInTheDocument();
    expect(lower()).toHaveValue("20");
    expect(upper()).toHaveValue("80");
    const sliders = screen.getAllByRole("slider");
    expect(sliders[0]).toBe(lower());
    expect(sliders[1]).toBe(upper());
    expect(fillPercentages()).toEqual(["20%", "80%"]);
  });

  it("covers the whole range without a value", () => {
    const { host } = mount();
    expect(host.value).toEqual([0, 100]);
  });

  it("reports the complete pair, once, from a single thumb's input", () => {
    const { host, changes } = mount(`value="20,80"`);
    move(lower(), "30");
    expect(changes).toEqual([[30, 80]]);
    expect(host.value).toEqual([30, 80]);
    expect(host).toHaveAttribute("value", "30,80");
  });

  it("clamps the moved thumb against the sibling plus min-distance, without crossing", () => {
    const { changes } = mount(`value="20,60" min-distance="5"`);
    move(lower(), "90");
    expect(changes).toEqual([[55, 60]]);
    expect(lower()).toHaveValue("55");
    expect(upper()).toHaveValue("60");
  });

  it("reports nothing when a request clamps back to the value it started from", () => {
    const { changes } = mount(`value="55,60" min-distance="5"`);
    move(lower(), "58");
    expect(changes).toEqual([]);
    // The native input moved on its own; the control puts it back.
    expect(lower()).toHaveValue("55");
  });

  it("reflects a value set by the page silently, normalized as a drag would be", () => {
    const { host, changes } = mount(`value="20,80" min-distance="10"`);
    host.value = [50, 52];
    expect(lower()).toHaveValue("50");
    expect(upper()).toHaveValue("60");
    // The next drag clamps against the normalized pair, not the raw one.
    move(lower(), "55");
    expect(changes).toEqual([]);
    expect(lower()).toHaveValue("50");
  });

  it("ignores a value that is not a pair of numbers", () => {
    const { host } = mount(`value="20,80"`);
    host.setAttribute("value", "20");
    expect(host.value).toEqual([20, 80]);
    expect(upper()).toHaveValue("80");
  });

  it("does not treat a partial echo as a give-back", async () => {
    const { host, form } = mount(`value="20,80"`);
    move(lower(), "30");
    // The page echoes the reported lower back but changes the upper too: a
    // real choice, so it becomes the new default.
    host.value = [30, 90];
    expect(lower().defaultValue).toBe("30");
    expect(upper().defaultValue).toBe("90");

    form.reset();
    await settled();
    expect(lower()).toHaveValue("30");
    expect(upper()).toHaveValue("90");
  });

  it("disables both thumbs and removes them from FormData", () => {
    const { form } = mount(`value="20,80" name="price" disabled`);
    expect(lower()).toBeDisabled();
    expect(upper()).toBeDisabled();
    expect([...new FormData(form).keys()]).toEqual([]);
  });

  it("submits two ordered values under one name", () => {
    const { form } = mount(`value="20,80" name="price"`);
    expect(new FormData(form).getAll("price")).toEqual(["20", "80"]);
    move(upper(), "90");
    expect(new FormData(form).getAll("price")).toEqual(["20", "90"]);
  });

  it("carries a normalized DOM default for both thumbs", () => {
    mount(`value="50,52" min-distance="10"`);
    expect(lower().defaultValue).toBe("50");
    expect(upper().defaultValue).toBe("60");
  });

  it("restores both thumbs and the fill on a form reset, reporting nothing", async () => {
    const { changes, form } = mount(`value="20,80"`);
    move(lower(), "40");
    move(upper(), "90");
    expect(lower().defaultValue).toBe("20");
    expect(upper().defaultValue).toBe("80");
    const reported = changes.length;

    form.reset();
    await settled();
    expect(lower()).toHaveValue("20");
    expect(upper()).toHaveValue("80");
    // The native reset moves the inputs by itself; only the element's own
    // restore puts the fill back.
    expect(fillPercentages()).toEqual(["20%", "80%"]);
    expect(changes).toHaveLength(reported);
  });

  it("keeps a float-step dependent bound exactly on the grid", () => {
    const { changes } = mount(`value="0.6,0.9" min="0" max="1" step="0.1" min-distance="0.3"`);
    expect(lower()).toHaveAttribute("aria-valuemax", "0.6");
    expect(upper()).toHaveAttribute("aria-valuemin", "0.9");
    move(lower(), "0.7");
    move(upper(), "0.8");
    expect(changes).toEqual([]);
    expect(lower()).toHaveValue("0.6");
    expect(upper()).toHaveValue("0.9");
  });

  it("reads reversed bounds as min and max in either order", () => {
    const { changes } = mount(`value="30,70" min="100" max="0"`);
    expect(lower()).toHaveAttribute("min", "0");
    expect(lower()).toHaveAttribute("max", "100");
    move(lower(), "50");
    expect(changes).toEqual([[50, 70]]);
  });

  it("draws one tick per grid point, none for a max the grid does not reach", () => {
    mount(`value="0,90" max="95" step="10" ticks`);
    const ticks = Array.from(document.querySelectorAll<HTMLElement>(".range-slider__tick"));
    expect(ticks).toHaveLength(10);
    expect(ticks[0]!.style.getPropertyValue("--_tick-pct")).toBe("0%");
    expect(parseFloat(ticks[9]!.style.getPropertyValue("--_tick-pct"))).toBeCloseTo(94.74, 1);
  });

  it("carries the dependent bound as an override and as localized text", () => {
    mount(`value="20,80" min-distance="5"`);
    expect(lower()).toHaveAttribute("aria-valuemax", "75");
    expect(upper()).toHaveAttribute("aria-valuemin", "25");
    expect(lower()).toHaveAttribute("aria-valuetext", "20, minimum; may not exceed 75");
    expect(upper()).toHaveAttribute("aria-valuetext", "80, maximum; may not go below 25");
  });

  it("formats the readouts and the value text through the format property", () => {
    const { host } = mount(`value="20,80" show-value show-range`);
    host.format = (value) => `€${value}`;
    expect(document.querySelector(".range-slider-field__value")).toHaveTextContent("€20 – €80");
    expect(document.querySelector(".range-slider-field__range")).toHaveTextContent("€0€100");
    expect(lower()).toHaveAttribute("aria-valuetext", "€20, minimum; may not exceed €80");
  });

  it("reads the value text from the locale provider around it", () => {
    document.body.innerHTML = `<ds-locale-provider locale="it"><ds-range-slider label="Prezzo"
      lower-label="Prezzo minimo" upper-label="Prezzo massimo" value="20,80"></ds-range-slider></ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as HTMLElement & {
      messages: Record<string, string>;
    };
    provider.messages = { "rangeSlider.lowerText": "{value}, minimo; massimo {bound}" };
    expect(screen.getByRole("slider", { name: "Prezzo minimo" })).toHaveAttribute(
      "aria-valuetext",
      "20, minimo; massimo 80",
    );
  });

  describe("reflects a constraint changed after mount", () => {
    it("min, without reporting", () => {
      const { host, changes } = mount(`value="20,80"`);
      host.setAttribute("min", "10");
      expect(lower()).toHaveAttribute("min", "10");
      expect(upper()).toHaveAttribute("aria-valuemax", "100");
      expect(fillPercentages().map((p) => Math.round(parseFloat(p)))).toEqual([11, 78]);
      expect(changes).toEqual([]);
    });

    it("max, normalizing the pair and the reset default silently", async () => {
      const { host, changes, form } = mount(`value="20,80"`);
      host.setAttribute("max", "50");
      expect(upper()).toHaveValue("50");
      expect(upper().defaultValue).toBe("50");
      expect(changes).toEqual([]);

      move(lower(), "40");
      expect(changes).toEqual([[40, 50]]);
      form.reset();
      await settled();
      expect(lower()).toHaveValue("20");
      expect(upper()).toHaveValue("50");
    });

    it("step, snapping the held pair onto the new grid", () => {
      const { host } = mount(`value="22,78"`);
      host.setAttribute("step", "5");
      expect(lower()).toHaveValue("20");
      expect(upper()).toHaveValue("80");
      expect(lower().defaultValue).toBe("20");
    });

    it("min-distance, pushing the pair apart", () => {
      const { host } = mount(`value="50,52"`);
      host.setAttribute("min-distance", "10");
      expect(upper()).toHaveValue("60");
      expect(lower()).toHaveAttribute("aria-valuemax", "50");
      expect(upper()).toHaveAttribute("aria-valuemin", "60");
    });

    it("orientation", () => {
      const { host } = mount(`value="20,80"`);
      host.setAttribute("orientation", "vertical");
      expect(lower()).toHaveAttribute("aria-orientation", "vertical");
      expect(upper()).toHaveAttribute("aria-orientation", "vertical");
      expect(document.querySelector(".range-slider")).toHaveAttribute(
        "data-orientation",
        "vertical",
      );
      expect(document.querySelector(".range-slider-field")).toHaveAttribute(
        "data-orientation",
        "vertical",
      );
    });

    it("disabled, both ways", () => {
      const { host, changes, form } = mount(`value="20,80" name="price"`);
      host.setAttribute("disabled", "");
      expect([...new FormData(form).keys()]).toEqual([]);
      host.removeAttribute("disabled");
      expect(new FormData(form).getAll("price")).toEqual(["20", "80"]);
      host.setAttribute("disabled", "");
      move(lower(), "30");
      expect(changes, "a disabled control reports nothing").toEqual([]);
    });
  });

  it("raises one thumb above the other at rest", () => {
    mount(`value="100,100"`);
    // Stacked at max: only the lower thumb can still move, so it is on top.
    expect(lower().style.zIndex).toBe("2");
    expect(upper().style.zIndex).toBe("1");
  });

  it("has no accessibility violations", async () => {
    mount(`value="20,80" show-value ticks step="10"`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
