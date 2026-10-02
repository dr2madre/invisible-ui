import { menu as core } from "@design-system/core";
import { boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { chevronIcon } from "../internal/icons";
import { MenuButton } from "../internal/menu";

export type MenuItem = core.MenuItem;
export type MenuEntry = core.MenuEntry;
export type MenuGroup = core.MenuGroup;
export type MenuSeparator = core.MenuSeparator;
export type MenuItemKind = core.MenuItemKind;

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

  #items: MenuEntry[] = [];
  #menu: MenuButton | null = null;
  #trigger: HTMLButtonElement | null = null;
  #labelText: HTMLSpanElement | null = null;
  #stopGhost: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "items");
    if (!this.#menu) this.#render();
    this.#stopGhost ??= ignoreGhostClicks(this.#trigger!);
    this.#apply();
  }

  disconnectedCallback() {
    this.#stopGhost?.();
    this.#stopGhost = null;
    // Leaving the page closes the menu quietly: focus has nowhere to return.
    this.#menu?.reset();
  }

  attributeChangedCallback() {
    if (this.#menu) this.#apply();
  }

  get items(): MenuEntry[] {
    return this.#items;
  }
  set items(items: MenuEntry[]) {
    this.#items = items;
    this.#menu?.setItems(items);
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

    // The stylesheet hides the closed popup through data-state; `hidden`
    // covers pages without the stylesheet.
    const popup = document.createElement("div");
    popup.className = "menu__popup";

    root.append(trigger, popup);
    this.appendChild(root);

    this.#trigger = trigger;
    this.#labelText = labelText;
    this.#menu = new MenuButton({
      prefix: "menu",
      trigger,
      popup,
      sameWidth: true,
      disabled: () => boolAttr(this, "disabled"),
      onSelect: (value) => emit(this, "select", { value }),
    });
    this.#menu.items = this.#items;
    this.#menu.render();
  }

  #apply() {
    this.#labelText!.textContent = this.getAttribute("label") ?? "";
    this.#menu!.apply();
  }
}
