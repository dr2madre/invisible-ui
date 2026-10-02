import { multiSelect as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  sameItems,
  upgradeProperty,
} from "../internal/base";
import { FieldMessages } from "../internal/field-message";
import { attachFloating } from "../internal/floating";
import { watchFormReset } from "../internal/form-reset";
import { checkIcon, removeIcon } from "../internal/icons";
import { localized, onLocaleChange, t } from "../internal/i18n";
import { defaultFilter, labelOf } from "../internal/listbox";
import { onOutside } from "../internal/outside";

export interface MultiSelectItem {
  value: string;
  label?: string;
  disabled?: boolean;
}

const parseValues = (attr: string | null): string[] =>
  attr ? attr.split(/\s+/).filter(Boolean) : [];

/**
 * `<ds-multi-select>` — the styled multi-value picker as a custom element.
 *
 * Behaviour and ARIA come from the headless multi select
 * (`@design-system/core`, a sibling of Combobox); this element owns the DOM
 * concerns: filtering, popup positioning (Floating UI),
 * close-on-outside-pointer and scroll-into-view. Light DOM only. DOM focus
 * stays on the input; the highlight travels via `aria-activedescendant`;
 * Enter adds the active option and keeps the popup open; selected options
 * stay listed with `aria-selected="true"`.
 *
 * Options come from light-DOM `<option>` children or the `items` property.
 * The selection is the `values` property (a string array), mirrored as a
 * space-separated `values` attribute. With `name`, one hidden input per value
 * is submitted in selection order; `required` only sets `aria-required`.
 *
 * Attributes: `label` (required), `values`, `placeholder`, `disabled`,
 * `readonly`, `max`, `remove-on-backspace`, `required`, `empty-text`, `name`,
 * `description`, `error`.
 * Emits: `change` (`detail.values: string[]`), `input-change`
 * (`detail.value`).
 */
export class DsMultiSelect extends HTMLElementBase {
  static observedAttributes = [
    "values",
    "disabled",
    "readonly",
    "max",
    "remove-on-backspace",
    "required",
    "empty-text",
    "label",
    "name",
    "placeholder",
    "description",
    "error",
  ];

  #input: HTMLInputElement | null = null;
  #listbox: HTMLUListElement | null = null;
  #control: HTMLDivElement | null = null;
  #tagList: HTMLUListElement | null = null;
  #label: HTMLLabelElement | null = null;
  #hiddenHost: HTMLSpanElement | null = null;
  #messages: FieldMessages | null = null;

  #all: MultiSelectItem[] = [];
  #itemsAssigned = false;
  #state = {
    open: false,
    values: [] as string[],
    inputValue: "",
    activeValue: null as string | null,
    items: [] as MultiSelectItem[],
  };
  #id = "";
  #stopOpen: (() => void) | null = null;
  #renderedItems: MultiSelectItem[] | null = null;
  #renderedValues: string[] | null = null;
  #renderedInert: boolean | null = null;
  #reflectingValues = false;
  /** What a form reset restores: the last values set from outside. */
  #defaultValues: string[] = [];
  #stopFormReset: (() => void) | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (!this.#input) return;
      this.#syncPresentation();
      // Remove buttons carry a localized name: rebuild them.
      this.#renderedValues = null;
      this.#applyAll();
    });
  }

  connectedCallback() {
    // Taken out of the page and put back while open (a server-driven swap, a
    // list that reorders): the listbox is still open, but the listener and
    // the repositioning went with the removal, so they are set up again.
    const reopen = this.#state.open;
    upgradeProperty(this, "values");
    upgradeProperty(this, "items");
    if (!this.#input) this.#render();
    this.#syncFromAttributes();
    if (reopen) {
      this.#setupOpen();
      // Being moved blurs whatever was focused, and the keys that close the
      // list live on the input: without this it can only be dismissed by
      // pointer. Focus is only taken back if the move is what lost it.
      const active = this.ownerDocument.activeElement;
      if (active === null || active === this.ownerDocument.body) this.#input?.focus();
    }
    this.#stopFormReset ??= watchFormReset(
      this,
      () => this.#input,
      () => this.#restore(),
    );
  }

  disconnectedCallback() {
    this.#teardownOpen();
    this.#stopFormReset?.();
    this.#stopFormReset = null;
  }

  attributeChangedCallback() {
    if (this.#input) this.#syncFromAttributes();
  }

  get values(): string[] {
    return this.#state.values;
  }
  set values(next: string[]) {
    this.#reflectValues(Array.isArray(next) ? next : []);
  }

  get items(): MultiSelectItem[] {
    return this.#all;
  }
  set items(items: MultiSelectItem[]) {
    this.#all = items;
    this.#itemsAssigned = true;
    if (this.#input) {
      const visible = this.#filter(this.#state.inputValue);
      this.#update({
        items: visible,
        activeValue: visible.some((item) => item.value === this.#state.activeValue)
          ? this.#state.activeValue
          : null,
      });
    }
  }

  #filter(query: string): MultiSelectItem[] {
    return defaultFilter(this.#all, query);
  }

  /** Write the values into state and mirror the attribute, without an event. */
  #reflectValues(values: string[]) {
    this.#reflectingValues = true;
    if (values.length === 0) this.removeAttribute("values");
    else this.setAttribute("values", values.join(" "));
    this.#reflectingValues = false;
    if (this.#input) this.#update({ values });
    else this.#state = { ...this.#state, values };
  }

  #render() {
    // A property assigned before the element connected (or before its
    // definition loaded) is the consumer's list; the light-DOM <option>
    // children are the declarative source only when none was assigned.
    if (!this.#itemsAssigned) {
      this.#all = Array.from(this.querySelectorAll("option")).map((option) => ({
        value: option.value,
        label: option.textContent?.trim() || option.value,
        disabled: option.disabled,
      }));
    }
    this.textContent = "";

    this.#state = {
      open: false,
      values: parseValues(this.getAttribute("values")),
      inputValue: "",
      activeValue: null,
      items: this.#filter(""),
    };
    // The markup's values are the first default a reset can restore.
    this.#defaultValues = this.#state.values;
    this.#id = core.initialState({ items: this.#all }).id;
    this.#messages = new FieldMessages(this.#id);

    const root = document.createElement("div");
    root.className = "multi-select";

    const hiddenHost = document.createElement("span");
    hiddenHost.hidden = true;

    const label = document.createElement("label");
    label.className = "multi-select__label";

    const control = document.createElement("div");
    control.className = "multi-select__control";

    const tagList = document.createElement("ul");
    tagList.className = "multi-select__values";

    const input = document.createElement("input");
    input.className = "multi-select__input";
    input.type = "text";
    input.addEventListener("input", () => {
      const text = input.value;
      const items = this.#filter(text);
      this.#update({ inputValue: text, items, activeValue: core.firstEnabled(items), open: true });
      emit(this, "input-change", { value: text });
    });
    input.addEventListener("pointerdown", () => {
      if (!this.#state.open) this.#api().openListbox();
    });

    control.append(tagList, input);

    const listbox = document.createElement("ul");
    listbox.className = "multi-select__listbox";

    root.append(hiddenHost, label, control, listbox);
    this.appendChild(root);

    this.#input = input;
    this.#listbox = listbox;
    this.#control = control;
    this.#tagList = tagList;
    this.#label = label;
    this.#hiddenHost = hiddenHost;

    this.#syncPresentation();
    this.#applyAll();
  }

  /** The attributes that shape the control rather than its state. */
  #syncPresentation() {
    const input = this.#input!;
    this.#label!.textContent = this.getAttribute("label") ?? "";
    input.placeholder = localized(this, "placeholder", "multiSelect.placeholder");
    input.disabled = boolAttr(this, "disabled");
    input.readOnly = boolAttr(this, "readonly");
    if (boolAttr(this, "required")) input.setAttribute("aria-required", "true");
    else input.removeAttribute("aria-required");
    this.#control!.classList.toggle("multi-select__control--disabled", boolAttr(this, "disabled"));
    this.#control!.classList.toggle("multi-select__control--readonly", boolAttr(this, "readonly"));
  }

  /** Connect the core over the current state. */
  #api() {
    const maxAttr = this.getAttribute("max");
    const max = maxAttr == null ? null : Number(maxAttr);
    return core.connect({
      state: {
        ...this.#state,
        disabled: boolAttr(this, "disabled"),
        readOnly: boolAttr(this, "readonly"),
        max: max != null && Number.isFinite(max) ? max : null,
        removeOnBackspace: boolAttr(this, "remove-on-backspace"),
        id: this.#id,
      },
      setValues: (values) => {
        // The attribute follows the selection, so a reconnect keeps it; one
        // event carries the whole array. State first, then the attribute: the
        // sync compares the two, and an attribute that matches the state is
        // an echo rather than a new default.
        this.#update({ values });
        this.#reflectingValues = true;
        if (values.length === 0) this.removeAttribute("values");
        else this.setAttribute("values", values.join(" "));
        this.#reflectingValues = false;
        emit(this, "change", { values });
      },
      setOpen: (open) => this.#update({ open }),
      setActiveValue: (activeValue) => this.#update({ activeValue }),
      setInputValue: (inputValue) => this.#update({ inputValue, items: this.#filter(inputValue) }),
    });
  }

  #update(patch: Partial<typeof this.__stateType>) {
    const wasOpen = this.#state.open;
    this.#state = { ...this.#state, ...patch };
    this.#applyAll();

    if (this.#state.open && !wasOpen) this.#setupOpen();
    if (!this.#state.open && wasOpen) this.#teardownOpen();
  }
  // Type helper only (never assigned).
  declare __stateType: {
    open: boolean;
    values: string[];
    inputValue: string;
    activeValue: string | null;
    items: MultiSelectItem[];
  };

  /** Re-apply the connected prop bags; rebuild options, tags, hidden inputs. */
  #applyAll() {
    const api = this.#api();
    const input = this.#input!;
    const listbox = this.#listbox!;
    const tagList = this.#tagList!;

    applyProps(input, api.inputProps);
    this.#messages!.sync(this, this.#control!.parentElement!, [input]);
    if (input.value !== this.#state.inputValue) input.value = this.#state.inputValue;
    applyProps(listbox, api.listboxProps);
    applyProps(this.#label!, api.labelProps);
    applyProps(tagList, api.valuesListProps);
    tagList.setAttribute("aria-label", t(this, "multiSelect.selected"));
    tagList.hidden = this.#state.values.length === 0;

    // Hidden inputs: one per value, selection order, none when empty or
    // unnamed. The inputs already there are reused.
    const name = this.getAttribute("name");
    const values = name ? this.#state.values : [];
    const hiddenHost = this.#hiddenHost!;
    values.forEach((value, index) => {
      let hidden = hiddenHost.children[index] as HTMLInputElement | undefined;
      if (!hidden) {
        hidden = document.createElement("input");
        hidden.type = "hidden";
        hiddenHost.appendChild(hidden);
      }
      hidden.name = name!;
      hidden.value = value;
      // A disabled control sends nothing, like every native one.
      hidden.disabled = boolAttr(this, "disabled");
    });
    while (hiddenHost.children.length > values.length) hiddenHost.lastElementChild!.remove();

    // Tags rebuild when the selection, the item list or the inert state
    // changed; labels are consumer data and go through textContent, never
    // markup.
    const inert = boolAttr(this, "disabled") || boolAttr(this, "readonly");
    if (
      this.#renderedValues !== this.#state.values ||
      this.#renderedItems !== this.#state.items ||
      this.#renderedInert !== inert
    ) {
      this.#renderedValues = this.#state.values;
      this.#renderedInert = inert;
      tagList.textContent = "";
      api.selectedItems.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "multi-select__value";
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.dataset.status = "neutral";
        tag.dataset.variant = "soft";
        tag.dataset.size = "md";
        const text = document.createElement("span");
        text.className = "tag__label";
        text.textContent = labelOf(item);
        tag.appendChild(text);
        if (!inert && !(item.disabled ?? false)) {
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "tag__remove";
          remove.setAttribute("aria-label", t(this, "multiSelect.remove", { name: labelOf(item) }));
          remove.innerHTML = removeIcon();
          remove.addEventListener("click", () => this.#removeAt(item.value, index));
          tag.appendChild(remove);
        }
        li.appendChild(tag);
        tagList.appendChild(li);
      });
    }

    // Option nodes rebuild only when the item list itself changed.
    if (this.#renderedItems !== this.#state.items) {
      this.#renderedItems = this.#state.items;
      listbox.textContent = "";
      if (this.#state.items.length === 0) {
        const li = document.createElement("li");
        li.className = "multi-select__empty";
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");
        li.setAttribute("aria-disabled", "true");
        listbox.appendChild(li);
      }
      for (const item of this.#state.items) {
        const li = document.createElement("li");
        li.className = "multi-select__option";

        const check = document.createElement("span");
        check.className = "multi-select__check";
        check.setAttribute("aria-hidden", "true");
        check.innerHTML = checkIcon();
        li.appendChild(check);

        const text = document.createElement("span");
        text.className = "multi-select__option-label";
        text.textContent = labelOf(item);
        li.appendChild(text);
        listbox.appendChild(li);
      }
    }

    const emptyNode = listbox.querySelector(".multi-select__empty");
    if (emptyNode) emptyNode.textContent = localized(this, "empty-text", "multiSelect.empty");

    const options = listbox.querySelectorAll<HTMLElement>(".multi-select__option");
    this.#state.items.forEach((item, index) => {
      const li = options[index];
      if (li) applyProps(li, api.getOptionProps(item.value));
    });

    if (this.#state.open) {
      requestAnimationFrame(() => {
        listbox.querySelector<HTMLElement>("[data-active]")?.scrollIntoView?.({ block: "nearest" });
      });
    }
  }

  /** Remove via a tag button: focus the next button, else previous, else input. */
  #removeAt(value: string, index: number) {
    this.#api().remove(value);
    requestAnimationFrame(() => {
      const buttons = this.#tagList
        ? Array.from(this.#tagList.querySelectorAll<HTMLElement>(".tag__remove"))
        : [];
      const target = buttons[index] ?? buttons[index - 1] ?? this.#input;
      target?.focus();
    });
  }

  #setupOpen() {
    // Opening is reachable while detached, so there may be a listener and a
    // subscription still in place: never stack a second pair on top.
    this.#teardownOpen();
    const input = this.#input!;
    const listbox = this.#listbox!;
    const stopFloating = attachFloating(input, listbox, { sameWidth: this.#control! });
    const stopOutside = onOutside([this.#control!, listbox], () =>
      this.#update({ open: false, activeValue: null }),
    );
    this.#stopOpen = () => {
      stopFloating();
      stopOutside();
    };
  }

  #teardownOpen() {
    this.#stopOpen?.();
    this.#stopOpen = null;
  }

  /**
   * Put the selection back to the current default, telling nobody. The values
   * travel in hidden inputs, which a form reset leaves untouched, so the whole
   * restore happens here.
   */
  #restore() {
    const restored = this.#defaultValues;
    this.#reflectingValues = true;
    if (restored.length === 0) this.removeAttribute("values");
    else this.setAttribute("values", restored.join(" "));
    this.#reflectingValues = false;
    // The query goes with the selection: the browser has just emptied the
    // input, and re-asserting the old text would type it back in.
    this.#update({
      values: restored,
      inputValue: "",
      items: this.#filter(""),
      activeValue: null,
    });
  }

  #syncFromAttributes() {
    this.#syncPresentation();

    // The default a reset restores follows the attribute, except when it only
    // hands back what the control already holds: that is the page echoing a
    // selection, and an echo is not a new default (ADR 0012).
    const declared = parseValues(this.getAttribute("values"));
    if (!sameItems(declared, this.#state.values)) this.#defaultValues = declared;

    // A `values` attribute change from outside is a controlled reflection;
    // one this element just wrote is already in state.
    if (!this.#reflectingValues && !sameItems(declared, this.#state.values)) {
      this.#update({ values: declared });
      return;
    }
    this.#applyAll();
  }
}
