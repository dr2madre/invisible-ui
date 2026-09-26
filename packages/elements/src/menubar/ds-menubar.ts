import type { menu as core } from "@design-system/core";
import { emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { MenuButton } from "../internal/menu";

/** One top-level menu in a menubar. */
export interface MenubarMenu {
  /** Stable value identifying this menu, reported with each selection. */
  value: string;
  /** Visible trigger label. */
  label: string;
  /** The menu's actions. */
  items: core.MenuItem[];
  /** Disable the whole menu. */
  disabled?: boolean;
}

interface MenubarPart {
  trigger: HTMLButtonElement;
  menu: MenuButton;
  stopGhost: () => void;
}

/**
 * `<ds-menubar>` — a horizontal bar of menus (WAI-ARIA menubar pattern), the
 * shape an application menu takes (File, Edit, View). Ported from the Vue
 * adapter, class names kept identical.
 *
 * Each menu is the same menu button `ds-dropdown-menu` renders: arrow keys,
 * Home and End move through its items, typeahead, Enter, Space or a click
 * activates, Escape and Tab close and return focus to the trigger. The bar adds
 * a roving tabindex across the triggers, ArrowLeft and ArrowRight to move
 * between them (or to switch the open menu), Home and End while every menu is
 * closed, and hover to switch while a menu is open. One menu is open at a time.
 *
 * The popups sit beside the bar, outside `role="menubar"`, the way the other
 * adapters portal them; the bar's keys still reach them through the host.
 *
 * The `label` attribute names the bar.
 *
 * Attributes: `label` (required).
 * Properties: `menus` (`MenubarMenu[]`: `{ value, label, items, disabled? }`).
 * Emits: bubbling `select` CustomEvent with `detail.menu` and `detail.value`,
 * after the menu closes.
 */
export class DsMenubar extends HTMLElementBase {
  static observedAttributes = ["label"];

  #menus: MenubarMenu[] = [];
  #parts: MenubarPart[] = [];
  #focusedIndex = 0;
  #bar: HTMLDivElement | null = null;

  connectedCallback() {
    upgradeProperty(this, "menus");
    if (!this.#bar) {
      const bar = document.createElement("div");
      bar.className = "menubar";
      bar.setAttribute("role", "menubar");
      bar.setAttribute("aria-orientation", "horizontal");
      this.textContent = "";
      this.appendChild(bar);
      this.#bar = bar;
      this.addEventListener("keydown", this.#onKeyDown);
      this.#build();
    }
    this.#apply();
  }

  disconnectedCallback() {
    // Leaving the page closes the menus quietly: focus has nowhere to return.
    for (const part of this.#parts) part.menu.reset();
  }

  attributeChangedCallback() {
    this.#apply();
  }

  get menus(): MenubarMenu[] {
    return this.#menus;
  }
  set menus(menus: MenubarMenu[]) {
    this.#menus = menus;
    if (!this.#bar) return;
    const hadFocus = this.contains(document.activeElement);
    this.#build();
    this.#apply();
    if (hadFocus) this.#parts[this.#focusedIndex]?.trigger.focus();
  }

  #build() {
    for (const part of this.#parts) {
      part.menu.reset();
      part.stopGhost();
    }
    const bar = this.#bar!;
    bar.textContent = "";
    for (const node of Array.from(this.children)) if (node !== bar) node.remove();
    this.#focusedIndex = Math.min(this.#focusedIndex, Math.max(this.#menus.length - 1, 0));

    this.#parts = this.#menus.map((config, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "menubar__menu";
      const trigger = document.createElement("button");
      trigger.className = "menubar__trigger";
      trigger.type = "button";
      trigger.setAttribute("role", "menuitem");
      trigger.textContent = config.label;
      trigger.addEventListener("focus", () => this.#setFocusedIndex(index));
      // Hover switches the open menu, only while another one is open.
      trigger.addEventListener("pointerenter", () => {
        const open = this.#openIndex();
        if (open !== -1 && open !== index) this.#openAt(index);
      });
      wrapper.appendChild(trigger);
      bar.appendChild(wrapper);

      // The stylesheet hides the closed popup through data-state; `hidden`
      // covers pages without the stylesheet.
      const popup = document.createElement("div");
      popup.className = "menubar__popup";
      this.appendChild(popup);

      const menu = new MenuButton({
        prefix: "menubar",
        trigger,
        popup,
        disabled: () => config.disabled ?? false,
        onSelect: (value) => emit(this, "select", { menu: config.value, value }),
        onOpenChange: (open) => {
          if (open) this.#setFocusedIndex(index);
        },
      });
      menu.items = config.items;
      menu.render();
      return { trigger, menu, stopGhost: ignoreGhostClicks(trigger) };
    });
  }

  #apply() {
    if (!this.#bar) return;
    this.#bar.setAttribute("aria-label", this.getAttribute("label") ?? "");
    this.#parts.forEach((part, index) => {
      part.menu.apply();
      part.trigger.tabIndex = index === this.#focusedIndex ? 0 : -1;
    });
  }

  #setFocusedIndex(index: number) {
    if (this.#focusedIndex === index) return;
    this.#focusedIndex = index;
    this.#apply();
  }

  #openIndex() {
    return this.#parts.findIndex((part) => part.menu.open);
  }

  #openAt(index: number) {
    this.#parts.forEach((part, i) => {
      if (i !== index && part.menu.open) part.menu.api().closeMenu();
    });
    const part = this.#parts[index];
    if (!part) return;
    part.menu.api().openMenu("first");
    // A disabled menu stays closed: its trigger takes focus instead.
    if (!part.menu.open) this.#focusTrigger(index);
  }

  #focusTrigger(index: number) {
    this.#setFocusedIndex(index);
    this.#parts[index]?.trigger.focus();
  }

  #onKeyDown = (event: KeyboardEvent) => {
    const total = this.#parts.length;
    if (total === 0) return;
    const open = this.#openIndex();
    const from = open !== -1 ? open : this.#focusedIndex;
    const move = (direction: 1 | -1) => {
      event.preventDefault();
      const next = (from + direction + total) % total;
      if (open !== -1) this.#openAt(next);
      else this.#focusTrigger(next);
    };
    switch (event.key) {
      case "ArrowRight":
        move(1);
        break;
      case "ArrowLeft":
        move(-1);
        break;
      // Home and End move between triggers only while closed; an open menu
      // uses them to jump between its own items.
      case "Home":
        if (open === -1) {
          event.preventDefault();
          this.#focusTrigger(0);
        }
        break;
      case "End":
        if (open === -1) {
          event.preventDefault();
          this.#focusTrigger(total - 1);
        }
        break;
    }
  };
}
