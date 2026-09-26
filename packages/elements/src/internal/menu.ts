import { menu as core } from "@design-system/core";
import { applyProps, nextId } from "./base";
import { attachFloating } from "./floating";
import { pathIcon } from "./icons";

/**
 * The menu parts the menu elements share: `ds-dropdown-menu`, `ds-context-menu`
 * and `ds-menubar` render the same headless menu (`@design-system/core`) under
 * their own class prefix (`menu__item`, `context-menu__item`, `menubar__item`).
 */

const TYPEAHEAD_RESET = 500;

/** Fill `popup` with the nodes for `items`, their classes under `prefix`. */
export function renderMenuEntries(
  popup: HTMLElement,
  items: core.MenuEntry[],
  api: core.MenuApi,
  prefix: string,
): void {
  const itemNode = (item: core.MenuItem): HTMLButtonElement => {
    const button = document.createElement("button");
    button.className = `${prefix}__item`;
    button.type = "button";
    applyProps(button, api.getItemProps(item.value));
    // A checkable item keeps its tick in a fixed column so labels line up
    // whether or not the item is on.
    if (item.kind) {
      const check = document.createElement("span");
      check.className = `${prefix}__check`;
      check.setAttribute("aria-hidden", "true");
      if (item.checked) check.appendChild(pathIcon("M20 6 9 17 4 12"));
      button.appendChild(check);
    }
    button.append(core.labelOf(item));
    return button;
  };

  popup.textContent = "";
  items.forEach((entry, index) => {
    if (core.isSeparator(entry)) {
      const separator = document.createElement("div");
      separator.className = `${prefix}__separator`;
      applyProps(separator, api.separatorProps);
      popup.appendChild(separator);
    } else if (core.isGroup(entry)) {
      const group = document.createElement("div");
      group.className = `${prefix}__group`;
      applyProps(group, api.getGroupProps(index));
      const label = document.createElement("div");
      label.className = `${prefix}__group-label`;
      label.textContent = entry.label;
      applyProps(label, api.getGroupLabelProps(index));
      group.appendChild(label);
      for (const item of entry.items) group.appendChild(itemNode(item));
      popup.appendChild(group);
    } else {
      popup.appendChild(itemNode(entry));
    }
  });
}

/** The rendered node of the item with `value`, if any. */
export function menuItemNode(popup: HTMLElement | null, value: string | null): HTMLElement | null {
  return value && popup
    ? popup.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
    : null;
}

/** Apply the current item props to every rendered item. */
export function syncMenuItems(
  popup: HTMLElement,
  items: core.MenuEntry[],
  api: core.MenuApi,
): void {
  for (const item of core.itemsOf(items)) {
    const node = menuItemNode(popup, item.value);
    if (node) applyProps(node, api.getItemProps(item.value));
  }
}

/** Typeahead over a menu's items: printable keys build a short-lived buffer. */
export class Typeahead {
  #buffer = "";
  #timer: ReturnType<typeof setTimeout> | undefined;

  /** The item the key moves to, or `null` when the key is not printable or nothing matches. */
  match(event: KeyboardEvent, items: core.MenuEntry[], activeValue: string | null): string | null {
    const printable =
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      /\S/.test(event.key);
    if (!printable) return null;
    this.#buffer += event.key;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => (this.#buffer = ""), TYPEAHEAD_RESET);
    return core.matchItem(items, this.#buffer, activeValue);
  }

  reset(): void {
    clearTimeout(this.#timer);
    this.#buffer = "";
  }
}

export interface MenuButtonOptions {
  /** Class prefix of the items: `menu` renders `menu__item`. */
  prefix: string;
  trigger: HTMLElement;
  /** Stays in the DOM while closed, hidden, so a press keeps the node it started on. */
  popup: HTMLElement;
  disabled: () => boolean;
  onSelect: (value: string) => void;
  /** Runs after the open state changed and the parts were updated. */
  onOpenChange?: (open: boolean) => void;
  /** Match the popup's minimum width to the trigger. */
  sameWidth?: boolean;
}

/**
 * One trigger button and its popup menu (WAI-ARIA menu button pattern). The
 * core owns the keys and ARIA; this controller owns the DOM side: roving focus
 * into the menu and back to the trigger on close, typeahead, positioning with
 * Floating UI and closing on an outside press. `ds-dropdown-menu` holds one,
 * `ds-menubar` one per menu.
 */
export class MenuButton {
  readonly id = nextId("ds-menu");
  items: core.MenuEntry[] = [];
  open = false;
  activeValue: string | null = null;

  #options: MenuButtonOptions;
  #stopFloating: (() => void) | null = null;
  #typeahead = new Typeahead();

  constructor(options: MenuButtonOptions) {
    this.#options = options;
    options.popup.addEventListener("keydown", this.#onTypeahead);
  }

  setItems(items: core.MenuEntry[]): void {
    this.items = items;
    const present = core.itemsOf(items).some((item) => item.value === this.activeValue);
    if (!present) this.activeValue = null;
    this.render();
    this.update();
  }

  api(): core.MenuApi {
    return core.connect({
      state: {
        open: this.open,
        activeValue: this.activeValue,
        items: this.items,
        disabled: this.#options.disabled(),
        id: this.id,
      },
      setOpen: (open) => {
        if (this.open === open) return;
        this.open = open;
        this.update();
        this.#options.onOpenChange?.(open);
      },
      setActiveValue: (value) => {
        if (this.activeValue === value) return;
        this.activeValue = value;
        this.update();
      },
      onSelect: (value) => this.#options.onSelect(value),
    });
  }

  render(): void {
    renderMenuEntries(this.#options.popup, this.items, this.api(), this.#options.prefix);
  }

  /** Apply the current state, then run the focus and overlay side effects. */
  update(): void {
    const wasOpen = this.#stopFloating !== null;
    this.apply();
    if (this.open && !wasOpen) this.#setupOpen();
    if (!this.open && wasOpen) {
      this.#teardownOpen();
      this.#options.trigger.focus();
    }
    // Roving focus: the active item holds DOM focus while the menu is open.
    if (this.open) menuItemNode(this.#options.popup, this.activeValue)?.focus();
  }

  /** Apply the current state to the trigger, the popup and the items. */
  apply(): void {
    const api = this.api();
    const { trigger, popup } = this.#options;
    applyProps(trigger, api.triggerProps);
    // The core marks a disabled trigger with aria-disabled only; the stylesheet
    // styles the disabled look from data-disabled.
    trigger.toggleAttribute("data-disabled", this.#options.disabled());
    applyProps(popup, api.menuProps);
    popup.hidden = !this.open;
    syncMenuItems(popup, this.items, api);
  }

  /** Close without moving focus: the element left the page. */
  reset(): void {
    this.#teardownOpen();
    this.open = false;
    this.activeValue = null;
    this.#typeahead.reset();
  }

  #setupOpen() {
    this.#teardownOpen();
    const { trigger, popup, sameWidth } = this.#options;
    this.#stopFloating = attachFloating(trigger, popup, { sameWidth });
    document.addEventListener("pointerdown", this.#onOutside, true);
  }

  #teardownOpen() {
    this.#stopFloating?.();
    this.#stopFloating = null;
    document.removeEventListener("pointerdown", this.#onOutside, true);
  }

  #onOutside = (event: Event) => {
    const target = event.target as Node;
    if (this.#options.trigger.contains(target) || this.#options.popup.contains(target)) return;
    this.api().closeMenu();
  };

  // Runs beside the core's own keydown handler on the popup.
  #onTypeahead = (event: KeyboardEvent) => {
    if (!this.open) return;
    const match = this.#typeahead.match(event, this.items, this.activeValue);
    if (match) this.api().setActive(match);
  };
}
