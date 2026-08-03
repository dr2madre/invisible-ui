import { combobox as core } from "@design-system/core";
import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { checkIcon, chevronIcon, closeIcon, searchIcon } from "../internal/icons";

export interface ComboboxItem {
  value: string;
  label?: string;
  disabled?: boolean;
  /** Optional leading icon (an SVG path `d` string). */
  icon?: string;
}

const defaultFilter = (items: ComboboxItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => (item.label ?? item.value).toLowerCase().includes(q));
};

const labelOf = (item: ComboboxItem) => item.label ?? item.value;

/**
 * `<ds-combobox>` — the editable autocomplete (and the design system's
 * advanced select) as a custom element.
 *
 * Behaviour and ARIA come from the headless combobox (`@design-system/core`);
 * this element owns the DOM concerns the core leaves to adapters: filtering,
 * popup positioning (Floating UI), close-on-outside-pointer and
 * scroll-into-view. DOM focus stays on the input; the highlight travels via
 * `aria-activedescendant`.
 *
 * Options come from light-DOM `<option>` children (`icon` attribute allowed)
 * or the `items` property. `searchable="false"` gives the select-only mode.
 *
 * Attributes: `label` (required), `value`, `searchable`, `width`
 * (wrap|fill|fixed), `placeholder`, `disabled`, `clear-label`, `empty-text`,
 * `name` (submits via a hidden input).
 * Emits: `change` (`detail.value`), `input-change` (`detail.value`).
 */
export class DsCombobox extends HTMLElementBase {
  static observedAttributes = ["value", "disabled"];

  #input: HTMLInputElement | null = null;
  #listbox: HTMLUListElement | null = null;
  #control: HTMLDivElement | null = null;
  #clear: HTMLButtonElement | null = null;
  #hidden: HTMLInputElement | null = null;

  #all: ComboboxItem[] = [];
  #state = {
    open: false,
    value: null as string | null,
    inputValue: "",
    activeValue: null as string | null,
    items: [] as ComboboxItem[],
  };
  #id = "";
  #searchable = true;
  #stopFloating: (() => void) | null = null;
  #onOutside: ((event: Event) => void) | null = null;
  #lastToggle = -Infinity;
  #renderedItems: ComboboxItem[] | null = null;

  connectedCallback() {
    upgradeProperty(this, "value");
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

  get value(): string | null {
    return this.#state.value;
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  get items(): ComboboxItem[] {
    return this.#all;
  }
  set items(items: ComboboxItem[]) {
    this.#all = items;
    if (this.#input) this.#update({ items: this.#filter(this.#state.inputValue) });
  }

  #filter(query: string): ComboboxItem[] {
    return this.#searchable ? defaultFilter(this.#all, query) : this.#all;
  }

  #render() {
    this.#searchable = boolAttr(this, "searchable", true);
    this.#all = Array.from(this.querySelectorAll("option")).map((option) => ({
      value: option.value,
      label: option.textContent?.trim() || option.value,
      disabled: option.disabled,
      icon: option.getAttribute("icon") ?? undefined,
    }));
    this.textContent = "";

    const initialValue = this.getAttribute("value");
    const selected = this.#all.find((i) => i.value === initialValue);
    this.#state = {
      open: false,
      value: selected ? selected.value : null,
      inputValue: selected ? labelOf(selected) : "",
      activeValue: null,
      items: this.#filter(""),
    };
    this.#id = core.initialState({ items: this.#all }).id;

    const root = document.createElement("div");
    root.className = "combobox";
    root.dataset.width = this.getAttribute("width") ?? "fixed";

    if (this.getAttribute("name")) {
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = this.getAttribute("name")!;
      root.appendChild(hidden);
      this.#hidden = hidden;
    }

    const label = document.createElement("label");
    label.className = "combobox__label";
    label.textContent = this.getAttribute("label") ?? "";

    const control = document.createElement("div");
    control.className = "combobox__control";

    const lead = document.createElement("span");
    lead.className = "combobox__search";
    lead.setAttribute("aria-hidden", "true");
    if (this.#searchable) lead.innerHTML = searchIcon();

    const input = document.createElement("input");
    input.className = this.#searchable
      ? "combobox__input"
      : "combobox__input combobox__input--select-only";
    input.type = "text";
    input.placeholder = this.getAttribute("placeholder") ?? "Search…";
    input.readOnly = !this.#searchable;
    input.addEventListener("input", () => {
      const text = input.value;
      const items = this.#filter(text);
      this.#update({ inputValue: text, items, activeValue: core.firstEnabled(items), open: true });
      emit(this, "input-change", { value: text });
    });
    input.addEventListener("pointerdown", () => {
      if (!this.#state.open) this.#api().openListbox();
    });

    const clear = document.createElement("button");
    clear.className = "combobox__clear combobox__clear--hidden";
    clear.setAttribute("aria-label", this.getAttribute("clear-label") ?? "Clear");
    clear.innerHTML = closeIcon();

    const chevron = document.createElement("button");
    chevron.className = "combobox__chevron";
    chevron.type = "button";
    chevron.tabIndex = -1;
    chevron.setAttribute("aria-label", "Show options");
    chevron.innerHTML = chevronIcon();
    chevron.addEventListener("mousedown", (event) => event.preventDefault());
    chevron.addEventListener("click", (event) => {
      // iOS Safari can synthesize a duplicate "ghost" click; ignore one that
      // lands right after the last so the list doesn't open then close.
      if (event.timeStamp - this.#lastToggle < 350) return;
      this.#lastToggle = event.timeStamp;
      if (this.#state.open) this.#update({ open: false, activeValue: null });
      else this.#openAll();
    });

    control.append(lead, input, clear, chevron);

    const listbox = document.createElement("ul");
    listbox.className = "combobox__listbox";

    root.append(label, control, listbox);
    this.appendChild(root);

    this.#input = input;
    this.#listbox = listbox;
    this.#control = control;
    this.#clear = clear;

    this.#applyAll();
  }

  /** Connect the core over the current state. */
  #api() {
    return core.connect({
      state: {
        ...this.#state,
        disabled: boolAttr(this, "disabled"),
        id: this.#id,
      },
      setValue: (value) => {
        this.#update({ value });
        const item = this.#all.find((i) => i.value === value);
        if (item) this.#update({ inputValue: labelOf(item) });
        if (value != null) {
          this.setAttribute("value", value);
          emit(this, "change", { value });
        }
      },
      setOpen: (open) => this.#update({ open }),
      setActiveValue: (activeValue) => this.#update({ activeValue }),
      setInputValue: (inputValue) => this.#update({ inputValue, items: this.#filter(inputValue) }),
    });
  }

  #openAll() {
    this.#update({
      open: true,
      items: this.#all,
      // No first-item pre-highlight; only the selected value (if any).
      activeValue: this.#state.value,
    });
    this.#input?.focus();
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
    value: string | null;
    inputValue: string;
    activeValue: string | null;
    items: ComboboxItem[];
  };

  /** Re-apply the connected prop bags and rebuild the option list. */
  #applyAll() {
    const api = this.#api();
    const input = this.#input!;
    const listbox = this.#listbox!;

    applyProps(input, api.inputProps);
    if (input.value !== this.#state.inputValue) input.value = this.#state.inputValue;
    applyProps(listbox, api.listboxProps);
    applyProps(this.querySelector(".combobox__label")!, api.labelProps);
    applyProps(this.#clear!, api.clearProps);

    const empty = !this.#state.inputValue;
    this.#clear!.classList.toggle("combobox__clear--hidden", empty);
    this.#clear!.tabIndex = empty ? -1 : 0;

    if (this.#hidden) this.#hidden.value = this.#state.value ?? "";

    // Rebuild the option nodes only when the item list itself changed;
    // highlight/selection updates re-decorate the existing nodes in place, so
    // a node is never replaced mid-gesture (between pointerdown and pointerup).
    if (this.#renderedItems !== this.#state.items) {
      this.#renderedItems = this.#state.items;
      listbox.textContent = "";
      const hasIcons = this.#all.some((item) => item.icon);
      if (this.#state.items.length === 0) {
        const li = document.createElement("li");
        li.className = "combobox__empty";
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");
        li.setAttribute("aria-disabled", "true");
        li.textContent = this.getAttribute("empty-text") ?? "No results";
        listbox.appendChild(li);
      }
      for (const item of this.#state.items) {
        const li = document.createElement("li");
        li.className = "combobox__option";

        const check = document.createElement("span");
        check.className = "combobox__check";
        check.setAttribute("aria-hidden", "true");
        check.innerHTML = checkIcon();
        li.appendChild(check);

        if (hasIcons) {
          const iconBox = document.createElement("span");
          iconBox.className = "combobox__option-icon";
          iconBox.setAttribute("aria-hidden", "true");
          if (item.icon) {
            iconBox.innerHTML = `<svg class="icon" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${item.icon}" /></svg>`;
          }
          li.appendChild(iconBox);
        }

        const text = document.createElement("span");
        text.className = "combobox__option-label";
        text.textContent = labelOf(item);
        li.appendChild(text);
        listbox.appendChild(li);
      }
    }

    // Decorate every option node with the connected props (selected/active
    // state, ids, handlers) — listeners are bookkept and replaced in place.
    const options = listbox.querySelectorAll<HTMLElement>(".combobox__option");
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

  #setupOpen() {
    const input = this.#input!;
    const listbox = this.#listbox!;
    listbox.style.minWidth = `${input.offsetWidth}px`;

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
    const attr = this.getAttribute("value");
    if (attr !== this.#state.value) {
      const item = this.#all.find((i) => i.value === attr);
      this.#update({
        value: item ? item.value : null,
        inputValue: item ? labelOf(item) : "",
      });
    } else {
      this.#applyAll();
    }
  }
}
