import { multiSelect as core } from "@design-system/core";
import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { checkIcon } from "../internal/icons";

export interface MultiSelectItem {
  value: string;
  label?: string;
  disabled?: boolean;
}

const defaultFilter = (items: MultiSelectItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

const labelOf = (item: MultiSelectItem) => item.label ?? item.value;

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
 * `readonly`, `max`, `remove-on-backspace`, `required`, `empty-text`, `name`.
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
  ];

  #input: HTMLInputElement | null = null;
  #listbox: HTMLUListElement | null = null;
  #control: HTMLDivElement | null = null;
  #tagList: HTMLUListElement | null = null;
  #label: HTMLLabelElement | null = null;
  #hiddenHost: HTMLSpanElement | null = null;

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
  #stopFloating: (() => void) | null = null;
  #onOutside: ((event: Event) => void) | null = null;
  #renderedItems: MultiSelectItem[] | null = null;
  #renderedValues: string[] | null = null;
  #renderedInert: boolean | null = null;
  #reflectingValues = false;

  connectedCallback() {
    upgradeProperty(this, "values");
    upgradeProperty(this, "items");
    if (!this.#input) this.#render();
    this.#syncFromAttributes();
  }

  disconnectedCallback() {
    this.#teardownOpen();
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
    this.#id = core.initialState({ items: this.#all }).id;

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
    input.placeholder = this.getAttribute("placeholder") ?? "Search…";
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
        // event carries the whole array.
        this.#reflectingValues = true;
        if (values.length === 0) this.removeAttribute("values");
        else this.setAttribute("values", values.join(" "));
        this.#reflectingValues = false;
        this.#update({ values });
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
    if (input.value !== this.#state.inputValue) input.value = this.#state.inputValue;
    applyProps(listbox, api.listboxProps);
    applyProps(this.#label!, api.labelProps);
    applyProps(tagList, api.valuesListProps);
    tagList.setAttribute("aria-label", "Selected values");
    tagList.hidden = this.#state.values.length === 0;

    // Hidden inputs: one per value, selection order, none when empty.
    const name = this.getAttribute("name");
    this.#hiddenHost!.textContent = "";
    if (name) {
      for (const value of this.#state.values) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = name;
        hidden.value = value;
        this.#hiddenHost!.appendChild(hidden);
      }
    }

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
          remove.setAttribute("aria-label", `Remove ${labelOf(item)}`);
          remove.innerHTML =
            '<svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';
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
    if (emptyNode) emptyNode.textContent = this.getAttribute("empty-text") ?? "No results";

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
    const input = this.#input!;
    const listbox = this.#listbox!;
    listbox.style.minWidth = `${this.#control?.offsetWidth ?? input.offsetWidth}px`;

    const reposition = () => {
      computePosition(input, listbox, {
        placement: "bottom-start",
        strategy: "fixed",
        middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        listbox.style.left = `${x}px`;
        listbox.style.top = `${y}px`;
      });
    };
    this.#stopFloating =
      typeof ResizeObserver !== "undefined"
        ? autoUpdate(input, listbox, reposition)
        : (reposition(), () => {});

    this.#onOutside = (event: Event) => {
      const target = event.target as Node;
      if (this.#control?.contains(target) || listbox.contains(target)) return;
      this.#update({ open: false, activeValue: null });
    };
    document.addEventListener("pointerdown", this.#onOutside, true);
  }

  #teardownOpen() {
    this.#stopFloating?.();
    this.#stopFloating = null;
    if (this.#onOutside) {
      document.removeEventListener("pointerdown", this.#onOutside, true);
      this.#onOutside = null;
    }
  }

  #syncFromAttributes() {
    this.#syncPresentation();

    // A `values` attribute change from outside is a controlled reflection;
    // one this element just wrote is already in state.
    if (!this.#reflectingValues) {
      const attr = parseValues(this.getAttribute("values"));
      const same =
        attr.length === this.#state.values.length &&
        attr.every((value, index) => value === this.#state.values[index]);
      if (!same) {
        this.#update({ values: attr });
        return;
      }
    }
    this.#applyAll();
  }
}
