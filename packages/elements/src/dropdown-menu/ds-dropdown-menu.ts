import { menu as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { attachFloating } from "../internal/floating";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { chevronIcon, pathIcon } from "../internal/icons";

export type MenuItem = core.MenuItem;
export type MenuEntry = core.MenuEntry;
export type MenuGroup = core.MenuGroup;
export type MenuSeparator = core.MenuSeparator;
export type MenuItemKind = core.MenuItemKind;

const TYPEAHEAD_RESET = 500;

/**
 * `<ds-dropdown-menu>` — the menu button (WAI-ARIA menu button pattern) as a
 * custom element. Ported from the Vue adapter, class names kept identical.
 *
 * A trigger opens a `role="menu"` of items. Behaviour and ARIA come from the
 * headless menu (`@design-system/core`): arrow keys, Home and End move, Enter,
 * Space or a click activates, Escape and Tab close. This element owns the DOM
 * concerns: roving focus into the menu and back to the trigger on close,
 * typeahead, positioning with Floating UI and closing on an outside press.
 *
 * Items come from the `items` property: actions (`{ value, label?, disabled? }`),
 * checkable items (`kind: "checkbox" | "radio"` with `checked`), separators
 * (`{ type: "separator" }`) and named groups (`{ type: "group", label, items }`).
 * The element reports an activation and leaves the new `checked` state to the
 * application, which assigns the updated list.
 *
 * Attributes: `label` (required), `disabled`.
 * Properties: `items` (`MenuEntry[]`).
 * Emits: bubbling `select` CustomEvent with `detail.value`, after the menu closes.
 */
export class DsDropdownMenu extends HTMLElementBase {
  static observedAttributes = ["label", "disabled"];

  #id = nextId("ds-menu");
  #items: MenuEntry[] = [];
  #open = false;
  #activeValue: string | null = null;

  #trigger: HTMLButtonElement | null = null;
  #labelText: HTMLSpanElement | null = null;
  #popup: HTMLDivElement | null = null;

  #stopFloating: (() => void) | null = null;
  #stopGhost: (() => void) | null = null;
  #buffer = "";
  #typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  connectedCallback() {
    upgradeProperty(this, "items");
    if (!this.#trigger) this.#render();
    this.#stopGhost ??= ignoreGhostClicks(this.#trigger!);
    this.#apply();
  }

  disconnectedCallback() {
    this.#stopGhost?.();
    this.#stopGhost = null;
    // Leaving the page closes the menu quietly: focus has nowhere to return.
    this.#teardownOpen();
    this.#open = false;
    this.#activeValue = null;
    clearTimeout(this.#typeaheadTimer);
  }

  attributeChangedCallback() {
    if (this.#trigger) this.#apply();
  }

  get items(): MenuEntry[] {
    return this.#items;
  }
  set items(items: MenuEntry[]) {
    this.#items = items;
    const present = core.itemsOf(items).some((item) => item.value === this.#activeValue);
    if (!present) this.#activeValue = null;
    if (!this.#popup) return;
    this.#renderEntries();
    this.#update();
  }

  #render() {
    this.textContent = "";

    const root = document.createElement("div");
    root.className = "menu";

    const trigger = document.createElement("button");
    trigger.className = "menu__trigger";
    trigger.type = "button";
    const labelText = document.createElement("span");
    const chevron = document.createElement("span");
    chevron.className = "menu__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.innerHTML = chevronIcon();
    trigger.append(labelText, chevron);

    // The popup stays in the DOM while closed so a press keeps the node it
    // started on; the stylesheet hides it through data-state, `hidden` covers
    // pages without the stylesheet.
    const popup = document.createElement("div");
    popup.className = "menu__popup";
    popup.addEventListener("keydown", this.#onTypeahead);

    root.append(trigger, popup);
    this.appendChild(root);

    this.#trigger = trigger;
    this.#labelText = labelText;
    this.#popup = popup;
    this.#renderEntries();
  }

  #renderEntries() {
    const popup = this.#popup!;
    const api = this.#api();
    popup.textContent = "";
    this.#items.forEach((entry, index) => {
      if (core.isSeparator(entry)) {
        const separator = document.createElement("div");
        separator.className = "menu__separator";
        applyProps(separator, api.separatorProps);
        popup.appendChild(separator);
      } else if (core.isGroup(entry)) {
        const group = document.createElement("div");
        group.className = "menu__group";
        applyProps(group, api.getGroupProps(index));
        const label = document.createElement("div");
        label.className = "menu__group-label";
        label.textContent = entry.label;
        applyProps(label, api.getGroupLabelProps(index));
        group.appendChild(label);
        for (const item of entry.items) group.appendChild(this.#itemNode(item));
        popup.appendChild(group);
      } else {
        popup.appendChild(this.#itemNode(entry));
      }
    });
  }

  #itemNode(item: MenuItem): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "menu__item";
    button.type = "button";
    applyProps(button, this.#api().getItemProps(item.value));
    // A checkable item keeps its tick in a fixed column so labels line up
    // whether or not the item is on.
    if (item.kind) {
      const check = document.createElement("span");
      check.className = "menu__check";
      check.setAttribute("aria-hidden", "true");
      if (item.checked) check.appendChild(pathIcon("M20 6 9 17 4 12"));
      button.appendChild(check);
    }
    button.append(core.labelOf(item));
    return button;
  }

  #api() {
    return core.connect({
      state: {
        open: this.#open,
        activeValue: this.#activeValue,
        items: this.#items,
        disabled: boolAttr(this, "disabled"),
        id: this.#id,
      },
      setOpen: (open) => {
        if (this.#open === open) return;
        this.#open = open;
        this.#update();
      },
      setActiveValue: (value) => {
        if (this.#activeValue === value) return;
        this.#activeValue = value;
        this.#update();
      },
      onSelect: (value) => emit(this, "select", { value }),
    });
  }

  #itemEl(value: string | null) {
    return value && this.#popup
      ? this.#popup.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
      : null;
  }

  /** Apply the current state, then run the focus and overlay side effects. */
  #update() {
    const wasOpen = this.#stopFloating !== null;
    this.#apply();
    if (this.#open && !wasOpen) this.#setupOpen();
    if (!this.#open && wasOpen) {
      this.#teardownOpen();
      this.#trigger?.focus();
    }
    // Roving focus: the active item holds DOM focus while the menu is open.
    if (this.#open) this.#itemEl(this.#activeValue)?.focus();
  }

  #apply() {
    const api = this.#api();
    const trigger = this.#trigger!;
    const popup = this.#popup!;
    this.#labelText!.textContent = this.getAttribute("label") ?? "";
    applyProps(trigger, api.triggerProps);
    // The core marks a disabled trigger with aria-disabled only; the stylesheet
    // styles the disabled look from data-disabled.
    trigger.toggleAttribute("data-disabled", boolAttr(this, "disabled"));
    applyProps(popup, api.menuProps);
    popup.hidden = !this.#open;
    for (const item of core.itemsOf(this.#items)) {
      const node = this.#itemEl(item.value);
      if (node) applyProps(node, api.getItemProps(item.value));
    }
  }

  #setupOpen() {
    this.#teardownOpen();
    this.#stopFloating = attachFloating(this.#trigger!, this.#popup!, { sameWidth: true });
    document.addEventListener("pointerdown", this.#onOutside, true);
  }

  #teardownOpen() {
    this.#stopFloating?.();
    this.#stopFloating = null;
    document.removeEventListener("pointerdown", this.#onOutside, true);
  }

  #onOutside = (event: Event) => {
    if (this.contains(event.target as Node)) return;
    this.#api().closeMenu();
  };

  // Runs beside the core's own keydown handler on the popup.
  #onTypeahead = (event: KeyboardEvent) => {
    if (!this.#open) return;
    const printable =
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      /\S/.test(event.key);
    if (!printable) return;
    this.#buffer += event.key;
    clearTimeout(this.#typeaheadTimer);
    this.#typeaheadTimer = setTimeout(() => (this.#buffer = ""), TYPEAHEAD_RESET);
    const match = core.matchItem(this.#items, this.#buffer, this.#activeValue);
    if (match) this.#api().setActive(match);
  };
}
