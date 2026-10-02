import { menu as core } from "@design-system/core";
import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { localized, onLocaleChange } from "../internal/i18n";
import { menuItemNode, renderMenuEntries, syncMenuItems, Typeahead } from "../internal/menu";

export type ContextMenuItem = core.MenuItem;

const LONG_PRESS = 500;
const MOVE_TOLERANCE = 10;

/**
 * `<ds-context-menu>` — a menu summoned on a region by right-click, by the
 * keyboard context-menu key (or Shift+F10), or by a long press on touch. It
 * opens a `role="menu"` of actions at the pointer. Ported from the Vue adapter,
 * class names kept identical. It stays a separate element from
 * `ds-dropdown-menu`; the two share the headless menu and the item rendering.
 *
 * The children are the region: they are wrapped in a focusable
 * `.context-menu__trigger`. Behaviour and ARIA come from the headless menu
 * (`@design-system/core`): arrow keys, Home and End move, Enter, Space or a
 * click activates, Escape and Tab close. This element owns the DOM concerns:
 * positioning against the pointer with Floating UI, roving focus, typeahead,
 * closing on an outside press or when the page scrolls, and returning focus to
 * where it was before the menu opened. The popup exists only while open.
 *
 * No trigger names the popup, so it carries `aria-label`: the `label`
 * attribute, or the catalog's "Context menu".
 *
 * Attributes: `label`, `disabled`.
 * Properties: `items` (`ContextMenuItem[]`: `{ value, label?, disabled? }`).
 * Emits: bubbling `select` CustomEvent with `detail.value`, after the menu closes.
 */
export class DsContextMenu extends HTMLElementBase {
  static observedAttributes = ["label", "disabled"];

  #id = nextId("ds-context-menu");
  #items: ContextMenuItem[] = [];
  #open = false;
  #activeValue: string | null = null;

  #region: HTMLDivElement | null = null;
  #popup: HTMLDivElement | null = null;

  // Viewport coordinates of the last open request: the pointer, or the
  // region's top-left corner when summoned from the keyboard.
  #point = { x: 0, y: 0 };
  #previouslyFocused: HTMLElement | null = null;
  #typeahead = new Typeahead();
  #pressTimer: ReturnType<typeof setTimeout> | undefined;
  #pressStart = { x: 0, y: 0 };

  constructor() {
    super();
    onLocaleChange(this, () => this.#apply());
  }

  connectedCallback() {
    upgradeProperty(this, "items");
    if (!this.#region) this.#render();
    this.#apply();
  }

  disconnectedCallback() {
    this.#cancelPress();
    // Leaving the page closes the menu quietly: focus has nowhere to return.
    this.#open = false;
    this.#activeValue = null;
    this.#unmount(false);
  }

  attributeChangedCallback() {
    this.#apply();
  }

  get items(): ContextMenuItem[] {
    return this.#items;
  }
  set items(items: ContextMenuItem[]) {
    this.#items = items;
    const present = items.some((item) => item.value === this.#activeValue);
    if (!present) this.#activeValue = null;
    if (!this.#popup) return;
    renderMenuEntries(this.#popup, items, this.#api(), "context-menu");
    this.#update();
  }

  #render() {
    const region = document.createElement("div");
    region.className = "context-menu__trigger";
    // Focusable, so the keyboard menu key can reach the region.
    region.tabIndex = 0;
    while (this.firstChild) region.appendChild(this.firstChild);
    region.addEventListener("contextmenu", this.#onContextMenu);
    region.addEventListener("pointerdown", this.#onPointerDown);
    region.addEventListener("pointerup", this.#cancelPress);
    region.addEventListener("pointercancel", this.#cancelPress);
    region.addEventListener("pointermove", this.#onPointerMove);
    this.appendChild(region);
    this.#region = region;
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

  /** Open, or summon again, at a viewport point, with the first item active. */
  #openAt(x: number, y: number) {
    if (boolAttr(this, "disabled")) return;
    this.#point = { x, y };
    this.#activeValue = core.firstEnabled(this.#items);
    if (this.#open) {
      this.#reposition();
      this.#update();
      return;
    }
    this.#previouslyFocused = document.activeElement as HTMLElement | null;
    this.#open = true;
    this.#update();
  }

  #update() {
    if (this.#open && !this.#popup) this.#mount();
    if (!this.#open && this.#popup) this.#unmount(true);
    this.#apply();
    // Roving focus: the active item holds DOM focus while the menu is open.
    if (this.#open) menuItemNode(this.#popup, this.#activeValue)?.focus();
  }

  #apply() {
    const popup = this.#popup;
    if (!popup) return;
    const api = this.#api();
    // No trigger element labels this popup: the core's aria-labelledby would
    // point at nothing, so the name comes from aria-label.
    const { ["aria-labelledby"]: _labelledBy, ...menuProps } = api.menuProps;
    applyProps(popup, menuProps);
    popup.setAttribute("aria-label", localized(this, "label", "contextMenu.label"));
    syncMenuItems(popup, this.#items, api);
  }

  #mount() {
    const popup = document.createElement("div");
    popup.className = "context-menu__popup";
    popup.addEventListener("keydown", this.#onTypeahead);
    this.appendChild(popup);
    this.#popup = popup;
    renderMenuEntries(popup, this.#items, this.#api(), "context-menu");
    // The anchor is a point in the viewport: the menu closes on scroll and on
    // an outside press, so one positioning pass is enough.
    this.#reposition();
    document.addEventListener("pointerdown", this.#onOutside, true);
    window.addEventListener("scroll", this.#onScroll, true);
  }

  #unmount(restoreFocus: boolean) {
    document.removeEventListener("pointerdown", this.#onOutside, true);
    window.removeEventListener("scroll", this.#onScroll, true);
    this.#typeahead.reset();
    this.#popup?.remove();
    this.#popup = null;
    const previous = this.#previouslyFocused;
    this.#previouslyFocused = null;
    if (restoreFocus && previous?.isConnected) previous.focus();
  }

  #reposition() {
    const popup = this.#popup;
    if (!popup) return;
    const { x, y } = this.#point;
    const anchor = {
      getBoundingClientRect: () => ({
        x,
        y,
        width: 0,
        height: 0,
        top: y,
        left: x,
        right: x,
        bottom: y,
      }),
    };
    void computePosition(anchor, popup, {
      placement: "right-start",
      strategy: "fixed",
      middleware: [offset(2), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then((position) => {
      popup.style.left = `${position.x}px`;
      popup.style.top = `${position.y}px`;
    });
  }

  #close() {
    this.#api().closeMenu();
  }

  #onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    // The keyboard menu key fires `contextmenu` without a pointer position.
    if (event.clientX === 0 && event.clientY === 0) {
      const rect = this.#region!.getBoundingClientRect();
      this.#openAt(rect.left, rect.top);
    } else {
      this.#openAt(event.clientX, event.clientY);
    }
  };

  // Touch has no right-click: a long press opens the menu at the press point.
  #onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    this.#pressStart = { x: event.clientX, y: event.clientY };
    clearTimeout(this.#pressTimer);
    this.#pressTimer = setTimeout(() => this.#openAt(event.clientX, event.clientY), LONG_PRESS);
  };

  #onPointerMove = (event: PointerEvent) => {
    if (
      Math.abs(event.clientX - this.#pressStart.x) > MOVE_TOLERANCE ||
      Math.abs(event.clientY - this.#pressStart.y) > MOVE_TOLERANCE
    )
      this.#cancelPress();
  };

  #cancelPress = () => clearTimeout(this.#pressTimer);

  #onOutside = (event: Event) => {
    if (this.#popup?.contains(event.target as Node)) return;
    this.#close();
  };

  // Scrolling inside the menu is fine; scrolling the page moves the point the
  // menu is anchored to.
  #onScroll = (event: Event) => {
    if (event.target instanceof Node && this.#popup?.contains(event.target)) return;
    this.#close();
  };

  // Runs beside the core's own keydown handler on the popup.
  #onTypeahead = (event: KeyboardEvent) => {
    const match = this.#typeahead.match(event, this.#items, this.#activeValue);
    if (match) this.#api().setActive(match);
  };
}
