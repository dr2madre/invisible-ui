import { rangeSlider as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { onLocaleChange, t } from "../internal/i18n";

export type RangeSliderOrientation = core.Orientation;
export type RangeSliderValue = readonly [number, number];

const MAX_TICKS = 20;

const numberAttr = (element: Element, name: string, fallback: number) => {
  const raw = element.getAttribute(name);
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

/** `"20,80"` as a pair, or null when either position is not a number. */
const parsePair = (raw: string | null): RangeSliderValue | null => {
  if (raw == null) return null;
  const parts = raw.split(",").map((part) => (part.trim() === "" ? NaN : Number(part)));
  if (parts.length !== 2 || !parts.every(Number.isFinite)) return null;
  return [parts[0]!, parts[1]!];
};

const isSamePair = (a: RangeSliderValue, b: RangeSliderValue) => a[0] === b[0] && a[1] === b[1];

/**
 * `<ds-range-slider>` — a styled two-thumb slider as a custom element, ported
 * from the Svelte adapter with identical classes.
 *
 * Light DOM: two real `<input type="range">` share one track, so the browser
 * owns each thumb's slider role, ARIA value, keyboard (arrows, Page, Home,
 * End), pointer dragging, focus and form participation. The core owns the
 * pair as a whole: the clamp that keeps the thumbs from crossing, the
 * dependent bound each thumb reports, and which thumb a press reaches.
 *
 * Both thumbs submit under `name`, in order: `FormData.getAll(name)` reads
 * `[lower, upper]`. A child with `slot="icon"` becomes a leading glyph; the
 * `format` property turns a number into the text the readouts show.
 *
 * ```html
 * <ds-range-slider label="Price" lower-label="Minimum price"
 *   upper-label="Maximum price" name="price" value="20,80"></ds-range-slider>
 * ```
 *
 * Attributes: `label` (required: the group's accessible name), `lower-label`
 * and `upper-label` (required: each thumb's own name), `value` (the pair as
 * `lower,upper`; the whole range by default), `min` (0 by default), `max`
 * (100 by default), `step` (1 by default), `min-distance` (the gap the
 * thumbs may not close; 0 by default), `orientation` (horizontal|vertical),
 * `disabled`, `name`, `show-value`, `show-range`, `ticks`.
 * Properties: `value` (`[lower, upper]`), `format`
 * (`(value: number) => string`).
 * Emits: bubbling `change` CustomEvent with `detail.value`, the complete pair,
 * whenever the user moves a thumb.
 */
export class DsRangeSlider extends HTMLElementBase {
  static observedAttributes = [
    "value",
    "min",
    "max",
    "step",
    "min-distance",
    "orientation",
    "disabled",
    "label",
    "lower-label",
    "upper-label",
    "name",
    "show-value",
    "show-range",
    "ticks",
  ];

  #field: HTMLDivElement | null = null;
  #row: HTMLDivElement | null = null;
  #root: HTMLDivElement | null = null;
  #track: HTMLDivElement | null = null;
  #range: HTMLSpanElement | null = null;
  #inputs: [HTMLInputElement, HTMLInputElement] | null = null;
  #icon: Element | null = null;
  /** The pair the control shows, normalized against the constraints. */
  #value: RangeSliderValue = [0, 100];
  /** What a form reset restores: the last pair set from outside. */
  #defaultValue: RangeSliderValue = [0, 100];
  #hovering = false;
  #format: (value: number) => string = (value) => String(value);
  #stopFormReset: (() => void) | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#inputs) this.#sync();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "value");
    upgradeProperty(this, "format");
    if (!this.#inputs) {
      const { min, max } = this.#constraints();
      this.#value = this.#normalize(parsePair(this.getAttribute("value")) ?? [min, max]);
      this.#defaultValue = this.#value;
      this.#render();
    }
    this.#sync();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#inputs?.[0] ?? null,
      () => this.#restore(),
    );
  }

  disconnectedCallback() {
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  attributeChangedCallback(name: string) {
    if (!this.#inputs) return;
    if (name === "value") {
      const given = parsePair(this.getAttribute("value"));
      // A pair that is not two numbers is not a position on the track: the
      // control keeps the last one it could show.
      if (given) {
        const next = this.#normalize(given);
        // The default follows the attribute, except an echo of what the
        // control already shows, compared across both positions at once: a
        // pair matching in only one position is the page's own choice
        // (ADR 0012).
        if (!isSamePair(next, this.#value)) this.#defaultValue = next;
        this.#value = next;
      }
    } else {
      // A constraint changed: the held pair and the default are normalized
      // against it silently, as a drag would have been, so neither a later
      // drag nor a native reset can reach a pair the constraints forbid.
      this.#value = this.#normalize(this.#value);
      this.#defaultValue = this.#normalize(this.#defaultValue);
    }
    this.#sync();
  }

  get value(): RangeSliderValue {
    if (this.#inputs) return this.#value;
    const { min, max } = this.#constraints();
    return parsePair(this.getAttribute("value")) ?? [min, max];
  }
  set value(next: RangeSliderValue) {
    this.setAttribute("value", `${next[0]},${next[1]}`);
  }

  get format(): (value: number) => string {
    return this.#format;
  }
  set format(next: (value: number) => string) {
    this.#format = typeof next === "function" ? next : (value) => String(value);
    if (this.#inputs) this.#sync();
  }

  #constraints() {
    const [min, max] = core.orderBounds(numberAttr(this, "min", 0), numberAttr(this, "max", 100));
    return {
      min,
      max,
      step: numberAttr(this, "step", 1),
      minDistance: numberAttr(this, "min-distance", 0),
    };
  }

  #normalize(pair: RangeSliderValue): RangeSliderValue {
    const { min, max, step, minDistance } = this.#constraints();
    return core.normalizePair(pair, min, max, step, minDistance);
  }

  #render() {
    for (const node of Array.from(this.childNodes)) {
      if (node instanceof Element && node.getAttribute("slot") === "icon") {
        node.removeAttribute("slot");
        this.#icon = node;
      }
    }
    this.textContent = "";

    const field = document.createElement("div");
    field.className = "range-slider-field";
    const row = document.createElement("div");
    row.className = "range-slider-field__row";

    if (this.#icon) {
      const icon = document.createElement("span");
      icon.className = "range-slider-field__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.appendChild(this.#icon);
      row.appendChild(icon);
    }

    const root = document.createElement("div");
    root.className = "range-slider";
    root.setAttribute("role", "group");

    const track = document.createElement("div");
    track.className = "range-slider__track";
    track.addEventListener("pointermove", (event) => this.#onPointerMove(event));
    track.addEventListener("pointerenter", () => {
      this.#hovering = true;
    });
    track.addEventListener("pointerleave", () => {
      this.#hovering = false;
      this.#rest();
    });

    const range = document.createElement("span");
    range.className = "range-slider__range";

    const inputs = ([0, 1] as const).map((index) => {
      const input = document.createElement("input");
      input.className = "range-slider__input";
      input.addEventListener("input", () => this.#onInput(index, input));
      // The host re-emits a CustomEvent with a typed detail; stop the native
      // change so listeners on the host don't receive the event twice.
      input.addEventListener("change", (event) => event.stopPropagation());
      return input;
    }) as [HTMLInputElement, HTMLInputElement];

    track.append(range, ...inputs);
    root.appendChild(track);
    row.appendChild(root);
    field.appendChild(row);
    this.appendChild(field);

    this.#field = field;
    this.#row = row;
    this.#root = root;
    this.#track = track;
    this.#range = range;
    this.#inputs = inputs;
  }

  #onInput(index: 0 | 1, input: HTMLInputElement) {
    const { min, max, step, minDistance } = this.#constraints();
    if (!boolAttr(this, "disabled")) {
      const next = core.clampPair(
        this.#value,
        index,
        Number(input.value),
        min,
        max,
        step,
        minDistance,
      );
      if (!isSamePair(next, this.#value)) {
        this.#value = next;
        this.value = next;
        emit(this, "change", { value: next });
      }
    }
    // A request the clamp refuses changes no state, so nothing renders, and
    // the native input would stay where the user pushed it, past the bound.
    // It is put back by hand.
    const held = String(this.#value[index]);
    if (input.value !== held) input.value = held;
  }

  /** Put the pair back to the current default, telling nobody. */
  #restore() {
    this.#value = this.#defaultValue;
    this.value = this.#defaultValue;
    this.#sync();
  }

  #sync() {
    const { min, max, step, minDistance } = this.#constraints();
    const orientation: RangeSliderOrientation =
      this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
    const disabled = boolAttr(this, "disabled");
    const state = core.initialState({
      value: this.#value,
      min,
      max,
      step,
      minDistance,
      orientation,
      disabled,
      id: "ds-range-slider",
    });
    const api = core.connect({ state, setValue: () => {} });

    const field = this.#field!;
    field.classList.toggle("range-slider-field--disabled", disabled);
    field.dataset.orientation = orientation;

    const root = this.#root!;
    root.classList.toggle("range-slider--disabled", disabled);
    applyProps(root, api.rootProps);
    root.setAttribute("aria-label", this.getAttribute("label") ?? "");
    root.style.setProperty("--_range-lower-pct", `${api.percentages[0]}%`);
    root.style.setProperty("--_range-upper-pct", `${api.percentages[1]}%`);
    applyProps(this.#range!, api.rangeProps);

    const name = this.getAttribute("name");
    const labels = [this.getAttribute("lower-label"), this.getAttribute("upper-label")];
    this.#inputs!.forEach((input, index) => {
      const props = api.getThumbProps(index as 0 | 1);
      applyProps(input, props);
      if (name) input.name = name;
      else input.removeAttribute("name");
      input.setAttribute("aria-label", labels[index] ?? "");
      // The bound named is the one the clamp really uses, read from the same
      // override core computes, so the text and the attribute never disagree.
      input.setAttribute(
        "aria-valuetext",
        index === 0
          ? t(this, "rangeSlider.lowerText", {
              value: this.#format(api.value[0]),
              bound: this.#format(Number(props["aria-valuemax"])),
            })
          : t(this, "rangeSlider.upperText", {
              value: this.#format(api.value[1]),
              bound: this.#format(Number(props["aria-valuemin"])),
            }),
      );
      // The attribute is the default, so the browser's own reset works and so
      // does one in markup the script never reaches; the property is what the
      // user sees.
      input.defaultValue = String(this.#defaultValue[index]);
      input.value = String(api.value[index]);
    });

    this.#syncTicks(min, max, step);
    this.#syncReadouts(api);
    if (!this.#hovering) this.#rest();
  }

  #syncTicks(min: number, max: number, step: number) {
    const track = this.#track!;
    // One tick per grid point the arrows can reach, spaced by the step: a max
    // the grid does not reach has no tick.
    const count = step > 0 ? Math.floor((max - min) / step) : 0;
    const positions =
      boolAttr(this, "ticks") && count > 0 && count <= MAX_TICKS
        ? Array.from({ length: count + 1 }, (_, i) => ((i * step) / (max - min)) * 100)
        : [];

    track.querySelector(".range-slider__ticks")?.remove();
    if (!positions.length) return;
    const ticks = document.createElement("span");
    ticks.className = "range-slider__ticks";
    ticks.setAttribute("aria-hidden", "true");
    for (const position of positions) {
      const tick = document.createElement("span");
      tick.className = "range-slider__tick";
      tick.style.setProperty("--_tick-pct", `${position}%`);
      ticks.appendChild(tick);
    }
    // Before the inputs, as the other adapters render it.
    this.#range!.after(ticks);
  }

  #syncReadouts(api: core.RangeSliderApi) {
    const row = this.#row!;
    let output = row.querySelector<HTMLOutputElement>(".range-slider-field__value");
    if (boolAttr(this, "show-value")) {
      if (!output) {
        output = document.createElement("output");
        output.className = "range-slider-field__value";
        row.appendChild(output);
      }
      output.textContent = `${this.#format(api.value[0])} – ${this.#format(api.value[1])}`;
    } else {
      output?.remove();
    }

    const field = this.#field!;
    let range = field.querySelector<HTMLDivElement>(".range-slider-field__range");
    if (boolAttr(this, "show-range")) {
      if (!range) {
        range = document.createElement("div");
        range.className = "range-slider-field__range";
        range.setAttribute("aria-hidden", "true");
        range.append(document.createElement("span"), document.createElement("span"));
        field.appendChild(range);
      }
      range.children[0]!.textContent = this.#format(api.min);
      range.children[1]!.textContent = this.#format(api.max);
    } else {
      range?.remove();
    }
  }

  // Two overlapping native range inputs hit-test by z-order, not by distance
  // to the pointer, so the thumb the next press should reach is raised before
  // the press lands. The rule lives in core; this feeds it what only the DOM
  // knows: the track's box and the input's writing direction, which decide
  // which physical end is `min`.
  #raise(index: 0 | 1) {
    const [lower, upper] = this.#inputs!;
    lower.style.zIndex = index === 0 ? "2" : "1";
    upper.style.zIndex = index === 1 ? "2" : "1";
  }

  #fractions(): [number, number] {
    const [lower, upper] = this.#inputs!;
    const min = Number(lower.min);
    const max = Number(lower.max);
    return [
      core.valueFraction(Number(lower.value), min, max),
      core.valueFraction(Number(upper.value), min, max),
    ];
  }

  /** With no pointer over the track, a touch still lands on a thumb that can move. */
  #rest() {
    const [lower, upper] = this.#fractions();
    this.#raise(core.restingThumb(lower, upper));
  }

  #onPointerMove(event: PointerEvent) {
    // A drag in progress keeps its thumb.
    if (event.buttons !== 0) return;
    const [lowerInput] = this.#inputs!;
    const styles = getComputedStyle(lowerInput);
    const axis: core.PointerAxis = {
      orientation: styles.writingMode.startsWith("vertical") ? "vertical" : "horizontal",
      rtl: styles.direction === "rtl",
    };
    const pointer = core.pointerFraction(
      axis,
      this.#track!.getBoundingClientRect(),
      event.clientX,
      event.clientY,
    );
    const [lower, upper] = this.#fractions();
    this.#raise(core.nearerThumb(pointer, lower, upper));
  }
}
