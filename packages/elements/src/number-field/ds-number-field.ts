import { i18n, numberField as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  syncAttribute,
  upgradeProperty,
} from "../internal/base";
import { watchFormReset } from "../internal/form-reset";
import { localeScope, localized, onLocaleChange, t } from "../internal/i18n";

/** A numeric attribute, or `undefined` when it is absent or not a number. */
const numberAttr = (el: Element, name: string): number | undefined => {
  const raw = el.getAttribute(name);
  if (raw == null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

/** The `value` attribute holds the canonical ASCII form, or nothing for empty. */
const valueAttr = (el: Element): number | null => numberAttr(el, "value") ?? null;

/**
 * `<ds-number-field>` — the locale-aware decimal field as a custom element.
 *
 * Light DOM: a text input with `role="spinbutton"` and `inputmode="decimal"`,
 * two spin buttons outside the tab order, and a hidden input that carries the
 * canonical ASCII value under `name`. The core owns parsing in the element's
 * locale, the draft kept apart from the value, stepping, clamping and the
 * commit boundaries (blur, Enter, spin actions).
 *
 * The locale comes from `locale`, else from the closest `<ds-locale-provider>`
 * or `lang`. The spin button names and the validation messages come from the
 * catalog; `increment-label` and `decrement-label` replace the button names.
 *
 * Attributes: `label` (required), `value` (canonical, e.g. `1234.5`), `locale`,
 * `min`, `max`, `step`, `disabled`, `readonly`, `required`, `change-on-wheel`,
 * `description`, `error`, `name`, `form`, `increment-label`, `decrement-label`.
 * Properties: `value` (number or null).
 * Emits: bubbling `input` CustomEvent while editing and `change` CustomEvent at
 * each commit, both with `detail.value` (number or null).
 */
export class DsNumberField extends HTMLElementBase {
  static observedAttributes = [
    "label",
    "value",
    "locale",
    "min",
    "max",
    "step",
    "disabled",
    "readonly",
    "required",
    "change-on-wheel",
    "description",
    "error",
    "name",
    "form",
    "increment-label",
    "decrement-label",
  ];

  #root: HTMLDivElement | null = null;
  #label: HTMLLabelElement | null = null;
  #input: HTMLInputElement | null = null;
  #increment: HTMLButtonElement | null = null;
  #decrement: HTMLButtonElement | null = null;
  #hidden: HTMLInputElement | null = null;
  #description: HTMLParagraphElement | null = null;
  #message: HTMLParagraphElement | null = null;
  #state: core.NumberFieldState | null = null;
  #api: core.NumberFieldApi | null = null;
  /** What a form reset restores: the last value set from outside. */
  #defaultValue: number | null = null;
  #stopFormReset: (() => void) | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#root) this.#sync();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "value");
    if (!this.#root) this.#render();
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

  attributeChangedCallback() {
    if (this.#root) this.#sync();
  }

  get value(): number | null {
    return this.#state?.value ?? valueAttr(this);
  }
  set value(next: number | null) {
    if (next == null || !Number.isFinite(next)) this.removeAttribute("value");
    else this.setAttribute("value", core.canonicalString(next));
  }

  #render() {
    const root = document.createElement("div");
    root.className = "number-field";

    const label = document.createElement("label");
    label.className = "field__label";

    const group = document.createElement("div");
    group.className = "number-field__group";

    const decrement = this.#spinButton("decrement", "−");
    const increment = this.#spinButton("increment", "+");

    const input = document.createElement("input");
    input.className = "field__control number-field__input";
    // The host re-emits typed CustomEvents; the native ones stop here so a
    // listener on the host does not receive both.
    input.addEventListener("input", (event) => {
      event.stopPropagation();
      this.#api?.setDraft(input.value);
    });
    input.addEventListener("change", (event) => event.stopPropagation());

    group.append(decrement, input, increment);

    const message = document.createElement("p");
    message.className = "field__error";
    message.setAttribute("aria-live", "polite");

    root.append(label, group, message);
    this.appendChild(root);

    this.#root = root;
    this.#label = label;
    this.#input = input;
    this.#increment = increment;
    this.#decrement = decrement;
    this.#message = message;

    const value = valueAttr(this);
    this.#defaultValue = value;
    this.#state = core.initialState({
      id: nextId("ds-number-field"),
      value,
      locale: this.#locale(),
    });
  }

  #spinButton(direction: "increment" | "decrement", glyph: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = `number-field__spin number-field__spin--${direction}`;
    const text = document.createElement("span");
    text.setAttribute("aria-hidden", "true");
    text.textContent = glyph;
    button.appendChild(text);
    return button;
  }

  #locale(): string {
    return this.getAttribute("locale") ?? localeScope(this).locale;
  }

  #editing(): boolean {
    const input = this.#input;
    return input != null && input.ownerDocument.activeElement === input;
  }

  /** Read the attributes into the state, then render it. */
  #sync() {
    const s = this.#state!;
    const locale = i18n.canonicalLocale(this.#locale());
    const min = numberAttr(this, "min");
    const max = numberAttr(this, "max");
    const step = numberAttr(this, "step");
    const next: core.NumberFieldState = {
      ...s,
      locale,
      min: min ?? null,
      max: max ?? null,
      step: step != null && step > 0 ? step : 1,
      disabled: boolAttr(this, "disabled"),
      readOnly: boolAttr(this, "readonly"),
      required: boolAttr(this, "required"),
      changeOnWheel: boolAttr(this, "change-on-wheel"),
    };
    // A locale change reformats an idle display, but only when it shows the
    // committed value: a focused draft or a kept invalid draft is user data.
    if (
      locale !== s.locale &&
      !this.#editing() &&
      s.inputValue === core.formatNumber(s.committedValue, s.locale)
    ) {
      next.inputValue = core.formatNumber(s.committedValue, locale);
    }
    // The value the element just reported comes back as an echo: it keeps the
    // draft and the commit boundary, and it is not a new reset default
    // (ADR 0012).
    const value = valueAttr(this);
    if (!Object.is(value, s.value)) {
      this.#defaultValue = value;
      next.value = value;
      next.committedValue = value;
      if (!this.#editing()) next.inputValue = core.formatNumber(value, locale);
    }
    this.#state = next;
    this.#update();
  }

  #setState(patch: Partial<core.NumberFieldState>) {
    this.#state = { ...this.#state!, ...patch };
    this.#update();
  }

  /** Write the current state to the DOM. */
  #update() {
    const s = this.#state!;
    const label = this.getAttribute("label") ?? "";
    const description = this.getAttribute("description");
    const error = this.getAttribute("error");
    const descriptionId = `${s.id}-description`;
    const errorId = `${s.id}-error`;

    const api = core.connect({
      state: s,
      setInputValue: (text) => this.#setState({ inputValue: text }),
      setValue: (value) => {
        this.#setState({ value });
        this.value = value;
        emit(this, "input", { value });
      },
      commitValue: (value) => {
        this.#setState({ committedValue: value });
        emit(this, "change", { value });
      },
      focus: () => this.#input?.focus(),
      invalid: Boolean(error),
      describedBy:
        [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") ||
        undefined,
      messages: {
        increment: localized(this, "increment-label", "numberField.increment", { label }),
        decrement: localized(this, "decrement-label", "numberField.decrement", { label }),
      },
    });
    this.#api = api;

    const input = this.#input!;
    applyProps(this.#label!, api.labelProps);
    this.#label!.textContent = label;
    if (s.required) {
      const marker = document.createElement("span");
      marker.className = "field__required";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = " *";
      this.#label!.appendChild(marker);
    }

    applyProps(input, api.inputProps);
    // The reset listener anchors on this input, so it names the owning form
    // when the field sits outside it.
    syncAttribute(this, input, "form");
    if (input.value !== s.inputValue) input.value = s.inputValue;
    applyProps(this.#increment!, api.incrementProps);
    applyProps(this.#decrement!, api.decrementProps);

    const root = this.#root!;
    const message = error ?? this.#validationMessage(api.validationError);
    root.classList.toggle("number-field--invalid", Boolean(message));
    root.classList.toggle("number-field--disabled", s.disabled);

    this.#syncHidden(api);

    if (description) {
      this.#description ??= document.createElement("p");
      this.#description.className = "field__description";
      this.#description.id = descriptionId;
      this.#description.textContent = description;
      root.insertBefore(this.#description, this.#message);
    } else {
      this.#description?.remove();
      this.#description = null;
    }

    const node = this.#message!;
    node.id = errorId;
    node.textContent = message ?? "";
    node.hidden = !message;
    if (error) node.setAttribute("role", "alert");
    else node.removeAttribute("role");
  }

  #syncHidden(api: core.NumberFieldApi) {
    const name = this.getAttribute("name");
    if (!name) {
      this.#hidden?.remove();
      this.#hidden = null;
      return;
    }
    if (!this.#hidden) {
      this.#hidden = document.createElement("input");
      this.#hidden.type = "hidden";
      this.#increment!.after(this.#hidden);
    }
    const hidden = this.#hidden;
    hidden.name = name;
    hidden.value = api.formValue;
    hidden.disabled = this.#state!.disabled;
    syncAttribute(this, hidden, "form");
  }

  #validationMessage(error: core.NumberFieldError | null): string | undefined {
    const s = this.#state!;
    switch (error) {
      case "parse":
        return t(this, "numberField.parseError");
      case "range-underflow":
        return t(this, "numberField.rangeUnderflow", {
          min: core.formatNumber(s.min ?? 0, s.locale),
        });
      case "range-overflow":
        return t(this, "numberField.rangeOverflow", {
          max: core.formatNumber(s.max ?? 0, s.locale),
        });
      case "step-mismatch":
        return t(this, "numberField.stepMismatch", { step: core.formatNumber(s.step, s.locale) });
      default:
        return undefined;
    }
  }

  /** Put the value back to the current default, telling nobody. */
  #restore() {
    const value = this.#defaultValue;
    const s = this.#state!;
    this.#state = {
      ...s,
      value,
      committedValue: value,
      inputValue: core.formatNumber(value, s.locale),
    };
    this.value = value;
    this.#update();
  }
}
