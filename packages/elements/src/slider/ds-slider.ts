import { slider as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { watchFormReset } from "../internal/form-reset";

export type SliderOrientation = core.Orientation;

// Above this many steps the ticks would crowd into a solid line, so they are
// dropped instead.
const MAX_TICKS = 20;

const numberAttr = (element: Element, name: string, fallback: number) => {
  const raw = element.getAttribute(name);
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

/**
 * `<ds-slider>` — a styled single-thumb slider as a custom element, ported
 * from the Svelte adapter with identical classes.
 *
 * Light DOM: a real `<input type="range">` sits in the page's tree, so the
 * browser owns the slider role, the ARIA value, the keyboard (arrows, Page,
 * Home, End), pointer dragging, focus and form participation. The core owns
 * the snapped value and the filled percentage the track reads.
 *
 * A child with `slot="icon"` becomes a leading glyph. The `format` property
 * turns a number into the text the value and range readouts show.
 *
 * ```html
 * <ds-slider label="Volume" name="volume" value="40" show-value></ds-slider>
 * ```
 *
 * Attributes: `label` (required: the accessible name), `value` (0 by default),
 * `min` (0 by default), `max` (100 by default), `step` (1 by default),
 * `orientation` (horizontal|vertical), `disabled`, `name`, `show-value`,
 * `show-range`, `ticks`.
 * Properties: `value` (number), `format` (`(value: number) => string`).
 * Emits: bubbling `change` CustomEvent with `detail.value` whenever the user
 * moves the thumb.
 */
export class DsSlider extends HTMLElementBase {
  static observedAttributes = [
    "value",
    "min",
    "max",
    "step",
    "orientation",
    "disabled",
    "label",
    "name",
    "show-value",
    "show-range",
    "ticks",
  ];

  #field: HTMLDivElement | null = null;
  #row: HTMLDivElement | null = null;
  #track: HTMLSpanElement | null = null;
  #input: HTMLInputElement | null = null;
  #icon: Element | null = null;
  /** The value the control shows, snapped onto the current grid. */
  #value = 0;
  /** What a form reset restores: the last value set from outside. */
  #defaultValue = 0;
  #format: (value: number) => string = (value) => String(value);
  #stopFormReset: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "value");
    upgradeProperty(this, "format");
    if (!this.#input) {
      this.#value = this.#snap(numberAttr(this, "value", 0));
      this.#defaultValue = this.#value;
      this.#render();
    }
    this.#sync();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#input,
      () => this.#restore(),
    );
  }

  disconnectedCallback() {
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  attributeChangedCallback(name: string) {
    if (!this.#input) return;
    if (name === "value") {
      const next = this.#snap(numberAttr(this, "value", this.#value));
      // The default a reset restores follows the attribute, except when it
      // only hands back what the control already shows: that is the page
      // echoing a drag, and an echo is not a new default (ADR 0012).
      if (next !== this.#value) this.#defaultValue = next;
      this.#value = next;
    } else {
      // A constraint changed: the held value and the default move onto the
      // new grid silently, as a drag would have put them.
      this.#value = this.#snap(this.#value);
      this.#defaultValue = this.#snap(this.#defaultValue);
    }
    this.#sync();
  }

  get value(): number {
    return this.#input ? this.#value : numberAttr(this, "value", 0);
  }
  set value(next: number) {
    this.setAttribute("value", String(next));
  }

  get format(): (value: number) => string {
    return this.#format;
  }
  set format(next: (value: number) => string) {
    this.#format = typeof next === "function" ? next : (value) => String(value);
    if (this.#input) this.#sync();
  }

  #state() {
    return core.initialState({
      value: this.#value,
      min: numberAttr(this, "min", 0),
      max: numberAttr(this, "max", 100),
      step: numberAttr(this, "step", 1),
      orientation: this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal",
      disabled: boolAttr(this, "disabled"),
      id: "ds-slider",
    });
  }

  #snap(value: number) {
    const min = numberAttr(this, "min", 0);
    const max = numberAttr(this, "max", 100);
    return core.snap(value, min, max, numberAttr(this, "step", 1));
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
    field.className = "slider-field";
    const row = document.createElement("div");
    row.className = "slider-field__row";

    if (this.#icon) {
      const icon = document.createElement("span");
      icon.className = "slider-field__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.appendChild(this.#icon);
      row.appendChild(icon);
    }

    const track = document.createElement("span");
    track.className = "slider";
    const input = document.createElement("input");
    input.className = "slider__input";
    // The host re-emits a CustomEvent with a typed detail; stop the native
    // change so listeners on the host don't receive the event twice.
    input.addEventListener("change", (event) => event.stopPropagation());
    track.appendChild(input);
    row.appendChild(track);
    field.appendChild(row);
    this.appendChild(field);

    this.#field = field;
    this.#row = row;
    this.#track = track;
    this.#input = input;
  }

  /** Put the value back to the current default, telling nobody. */
  #restore() {
    this.#value = this.#defaultValue;
    this.value = this.#defaultValue;
    this.#sync();
  }

  #sync() {
    const state = this.#state();
    const disabled = state.disabled;
    const api = core.connect({
      state,
      setValue: (next) => {
        if (next === this.#value) return;
        this.#value = next;
        this.value = next;
        emit(this, "change", { value: next });
      },
    });

    const field = this.#field!;
    const track = this.#track!;
    const input = this.#input!;
    field.classList.toggle("slider-field--disabled", disabled);
    track.classList.toggle("slider--disabled", disabled);
    track.dataset.orientation = state.orientation;
    track.style.setProperty("--_slider-pct", `${api.percentage}%`);

    applyProps(input, api.inputProps);
    const name = this.getAttribute("name");
    if (name) input.name = name;
    else input.removeAttribute("name");
    input.setAttribute("aria-label", this.getAttribute("label") ?? "");
    // The attribute is the default, so the browser's own reset works and so
    // does one in markup the script never reaches; the property is what the
    // user sees.
    input.defaultValue = String(this.#defaultValue);
    input.value = String(api.value);

    this.#syncTicks(api);
    this.#syncReadouts(api);
  }

  #syncTicks(api: core.SliderApi) {
    const track = this.#track!;
    const { min, max, step } = api;
    const count = step > 0 ? Math.round((max - min) / step) : 0;
    const positions =
      boolAttr(this, "ticks") && count > 0 && count <= MAX_TICKS
        ? Array.from({ length: count + 1 }, (_, i) => (i / count) * 100)
        : [];

    track.querySelector(".slider__ticks")?.remove();
    if (!positions.length) return;
    const ticks = document.createElement("span");
    ticks.className = "slider__ticks";
    ticks.setAttribute("aria-hidden", "true");
    for (const position of positions) {
      const tick = document.createElement("span");
      tick.className = "slider__tick";
      tick.style.insetInlineStart = `${position}%`;
      ticks.appendChild(tick);
    }
    track.appendChild(ticks);
  }

  #syncReadouts(api: core.SliderApi) {
    const row = this.#row!;
    let output = row.querySelector<HTMLOutputElement>(".slider-field__value");
    if (boolAttr(this, "show-value")) {
      if (!output) {
        output = document.createElement("output");
        output.className = "slider-field__value";
        row.appendChild(output);
      }
      output.textContent = this.#format(api.value);
    } else {
      output?.remove();
    }

    const field = this.#field!;
    let range = field.querySelector<HTMLDivElement>(".slider-field__range");
    if (boolAttr(this, "show-range")) {
      if (!range) {
        range = document.createElement("div");
        range.className = "slider-field__range";
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
}
