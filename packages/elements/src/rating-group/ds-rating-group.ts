import { radioGroup as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { onLocaleChange, t } from "../internal/i18n";
import { starIcon } from "../internal/icons";

const numberAttr = (element: Element, name: string, fallback: number) => {
  const raw = element.getAttribute(name);
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

/**
 * `<ds-rating-group>` — a star rating as a custom element, ported from the
 * Svelte adapter with identical classes.
 *
 * Light DOM: each star is a real `<input type="radio">` sharing one `name`,
 * so the browser owns single selection, the roving tabindex, arrow keys,
 * focus and form participation. The core owns the selection model and the
 * group's ARIA; this layer draws the stars and a pointer-hover preview.
 *
 * Each star is named from the locale's catalog ("3 stars").
 *
 * ```html
 * <ds-rating-group label="Rating" name="rating" value="4"></ds-rating-group>
 * ```
 *
 * Attributes: `label` (required: the group's accessible name), `max` (the
 * number of stars; 5 by default), `value` (the selected rating, 1 to `max`),
 * `name` (generated when absent, so the stars still form one group),
 * `disabled`.
 * Properties: `value` (number or null).
 * Emits: bubbling `change` CustomEvent with `detail.value`, the rating as a
 * number.
 */
export class DsRatingGroup extends HTMLElementBase {
  static observedAttributes = ["value", "max", "disabled", "label", "name"];

  #group: HTMLDivElement | null = null;
  #label: HTMLSpanElement | null = null;
  #stars: { position: number; label: HTMLLabelElement; input: HTMLInputElement }[] = [];
  #labelId = nextId("ds-rating-label");
  // Without a shared name the browser treats every star as its own group:
  // arrow keys stop moving between them and more than one can be checked.
  #fallbackName = nextId("ds-rating");
  /** Stars up to this one show a preview while the pointer is over them. */
  #hovered = 0;
  /** What a form reset restores: the last value set from outside. */
  #defaultValue: string | null = null;
  #stopFormReset: (() => void) | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#group) this.#sync();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "value");
    if (!this.#group) this.#render();
    this.#sync();
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#stars[0]?.input ?? null,
      () => this.#restore(),
    );
  }

  disconnectedCallback() {
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  attributeChangedCallback(name: string) {
    if (!this.#group) return;
    if (name === "max") this.#renderStars();
    this.#sync();
  }

  get value(): number | null {
    const raw = this.getAttribute("value");
    if (raw == null || raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }
  set value(next: number | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", String(next));
  }

  #max() {
    return Math.max(1, Math.floor(numberAttr(this, "max", 5)));
  }

  #render() {
    const field = document.createElement("div");
    field.className = "rating-field";

    const label = document.createElement("span");
    label.className = "rating__label";
    label.id = this.#labelId;

    // The native radios own focus and the roving tabindex, so the group
    // itself takes none.
    const group = document.createElement("div");
    group.className = "rating";
    group.addEventListener("pointerleave", () => this.#preview(0));

    field.append(label, group);
    this.appendChild(field);
    this.#group = group;
    this.#label = label;
    this.#renderStars();
  }

  #renderStars() {
    const group = this.#group!;
    group.textContent = "";
    this.#stars = Array.from({ length: this.#max() }, (_, i) => {
      const position = i + 1;
      const label = document.createElement("label");
      label.className = "rating__star";
      label.addEventListener("pointerenter", () => {
        if (!boolAttr(this, "disabled")) this.#preview(position);
      });

      const input = document.createElement("input");
      input.className = "rating__input";
      // The host re-emits a CustomEvent with a typed detail; stop the native
      // change here so listeners on the host don't receive the event twice.
      input.addEventListener("change", (event) => event.stopPropagation());

      label.appendChild(input);
      label.insertAdjacentHTML("beforeend", starIcon());
      group.appendChild(label);
      return { position, label, input };
    });
  }

  #preview(position: number) {
    this.#hovered = position;
    this.#paint();
  }

  /** The filled stars follow the selection; while hovering, the preview does. */
  #paint() {
    const selected = this.value ?? 0;
    const hovered = this.#hovered;
    for (const star of this.#stars) {
      star.label.classList.toggle("rating__star--filled", !hovered && star.position <= selected);
      star.label.classList.toggle("rating__star--preview", hovered > 0 && star.position <= hovered);
    }
  }

  /** Put the value back to the current default, telling nobody. */
  #restore() {
    const restored = this.#defaultValue;
    for (const star of this.#stars) star.input.checked = String(star.position) === restored;
    if (restored == null) this.removeAttribute("value");
    else this.setAttribute("value", restored);
    this.#sync();
  }

  #sync() {
    const group = this.#group!;
    const disabled = boolAttr(this, "disabled");
    const value = this.value != null ? String(this.value) : null;
    // The default a reset restores follows the attribute, except when it only
    // hands back what the control already shows: that is the page echoing a
    // choice, and an echo is not a new default (ADR 0012).
    const shown = this.#stars.find((star) => star.input.checked)?.position ?? null;
    if (value !== (shown != null ? String(shown) : null)) this.#defaultValue = value;

    this.#label!.textContent = this.getAttribute("label") ?? "";

    const api = core.connect({
      state: core.initialState({
        items: this.#stars.map((star) => ({ value: String(star.position) })),
        value: value ?? undefined,
        orientation: "horizontal",
        disabled,
      }),
      name: this.getAttribute("name") ?? this.#fallbackName,
      setValue: (next) => {
        this.setAttribute("value", next);
        emit(this, "change", { value: Number(next) });
      },
    });

    applyProps(group, api.rootProps);
    group.setAttribute("aria-labelledby", this.#labelId);
    group.classList.toggle("rating--disabled", disabled);

    for (const star of this.#stars) {
      const item = String(star.position);
      applyProps(star.input, api.getItemProps(item));
      star.input.setAttribute("aria-label", t(this, "rating.stars", { count: star.position }));
      star.input.checked = api.value === item;
      // The real DOM default, so the browser's own reset works and so does one
      // in markup the script never reaches.
      star.input.defaultChecked = this.#defaultValue === item;
    }
    this.#paint();
  }
}
