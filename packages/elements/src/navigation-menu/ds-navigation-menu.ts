import { navigationMenu as core } from "@design-system/core";
import { applyProps, emit, HTMLElementBase, nextId, upgradeProperty } from "../internal/base";
import { attachFloating } from "../internal/floating";
import { pathIcon } from "../internal/icons";

/** A link inside a navigation menu panel. */
export interface NavigationMenuLink {
  label: string;
  href: string;
  description?: string;
}

/** A top-level item: a plain link (`href`) or a panel item revealing `links`. */
export interface NavigationMenuItem {
  value: string;
  label: string;
  href?: string;
  links?: NavigationMenuLink[];
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const CHEVRON_DOWN = "M6 9l6 6 6-6";

const numberAttr = (element: Element, name: string, fallback: number) => {
  const value = Number(element.getAttribute(name));
  return element.hasAttribute(name) && Number.isFinite(value) ? value : fallback;
};

/**
 * `<ds-navigation-menu>` — a site navigation bar where some items reveal a
 * panel of links. Ported from the Vue adapter, class names kept identical.
 * Plain items are ordinary links; panel items are disclosures, at most one
 * open. State and ARIA come from the headless navigation menu; this element
 * adds hover opening with delays (switching between open panels is
 * immediate), Floating UI positioning, dismissal on an outside press, and
 * focus movement: ArrowDown moves into the panel, Escape returns to its
 * trigger.
 *
 * Attributes: `label` (required: the landmark name), `value` (the open item),
 * `open-delay` (ms, 150), `close-delay` (ms, 150).
 * Properties: `items`, `value`.
 * Emits: bubbling `value-change` with `detail.value` (`null` when closed).
 */
export class DsNavigationMenu extends HTMLElementBase {
  static observedAttributes = ["label", "value"];

  #items: NavigationMenuItem[] = [];
  #value: string | null = null;
  #id = nextId("ds-navigation-menu");
  #nav: HTMLElement | null = null;
  #triggers = new Map<string, HTMLButtonElement>();
  #panel: HTMLDivElement | null = null;
  #openTimer: ReturnType<typeof setTimeout> | undefined;
  #closeTimer: ReturnType<typeof setTimeout> | undefined;
  #cleanup: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "items");
    upgradeProperty(this, "value");
    if (!this.#nav) {
      this.#nav = document.createElement("nav");
      this.#nav.className = "navmenu";
      this.appendChild(this.#nav);
      this.#value = this.getAttribute("value");
      this.#renderItems();
    }
    this.#apply();
  }

  disconnectedCallback() {
    this.#hold();
    this.#closePanel();
  }

  attributeChangedCallback(name: string) {
    if (!this.#nav) return;
    if (name === "value") this.#setValue(this.getAttribute("value"), false);
    else this.#apply();
  }

  get items(): NavigationMenuItem[] {
    return this.#items;
  }
  set items(value: NavigationMenuItem[]) {
    this.#items = Array.isArray(value) ? value : [];
    if (!this.#nav) return;
    this.#closePanel();
    this.#renderItems();
    this.#apply();
  }

  get value(): string | null {
    return this.#value;
  }
  set value(next: string | null) {
    this.#setValue(next, false);
  }

  #api() {
    return core.connect({
      state: { value: this.#value, id: this.#id },
      setValue: (next) => this.#setValue(next, true),
    });
  }

  #setValue(next: string | null, report: boolean) {
    if (this.#value === next) return;
    this.#value = next;
    if (next == null) this.removeAttribute("value");
    else if (this.getAttribute("value") !== next) this.setAttribute("value", next);
    if (report) emit(this, "value-change", { value: next });
    this.#apply();
  }

  #hold() {
    clearTimeout(this.#openTimer);
    clearTimeout(this.#closeTimer);
  }

  #scheduleClose = () => {
    this.#hold();
    this.#closeTimer = setTimeout(
      () => this.#setValue(null, true),
      numberAttr(this, "close-delay", 150),
    );
  };

  #onTriggerEnter(value: string, event: PointerEvent) {
    // Touch has no hover: a tap fires pointerenter and click, and the click
    // owns touch, so the panel does not flash open and closed.
    if (event.pointerType === "touch") return;
    this.#hold();
    if (this.#value !== null && this.#value !== value) this.#setValue(value, true);
    else if (this.#value === null) {
      this.#openTimer = setTimeout(
        () => this.#setValue(value, true),
        numberAttr(this, "open-delay", 150),
      );
    }
  }

  #renderItems() {
    const nav = this.#nav!;
    nav.textContent = "";
    this.#triggers.clear();
    const list = document.createElement("ul");
    list.className = "navmenu__list";
    for (const item of this.#items) {
      const li = document.createElement("li");
      li.className = "navmenu__item";
      if (item.links) {
        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "navmenu__trigger";
        trigger.append(item.label);
        const chevron = document.createElement("span");
        chevron.className = "navmenu__chevron";
        chevron.setAttribute("aria-hidden", "true");
        chevron.appendChild(pathIcon(CHEVRON_DOWN));
        trigger.appendChild(chevron);
        trigger.addEventListener("pointerenter", (e) => this.#onTriggerEnter(item.value, e));
        trigger.addEventListener("pointerleave", this.#scheduleClose);
        // ArrowDown also moves focus into the panel. This listener runs before
        // the core's, and a browser runs microtasks between listeners, so the
        // panel is opened here rather than awaited; the core's open is then a
        // no-op.
        trigger.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowDown") return;
          this.#setValue(item.value, true);
          this.#panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
        });
        li.appendChild(trigger);
        this.#triggers.set(item.value, trigger);
      } else {
        const link = document.createElement("a");
        link.className = "navmenu__toplink";
        link.href = item.href ?? "#";
        link.textContent = item.label;
        li.appendChild(link);
      }
      list.appendChild(li);
    }
    nav.appendChild(list);
  }

  #closePanel() {
    this.#cleanup?.();
    this.#cleanup = null;
    this.#panel?.remove();
    this.#panel = null;
  }

  #openPanel(item: NavigationMenuItem, trigger: HTMLButtonElement) {
    const panel = document.createElement("div");
    panel.className = "navmenu__content";
    const links = document.createElement("ul");
    links.className = "navmenu__links";
    for (const entry of item.links ?? []) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "navmenu__link";
      a.href = entry.href;
      const label = document.createElement("span");
      label.className = "navmenu__link-label";
      label.textContent = entry.label;
      a.appendChild(label);
      if (entry.description) {
        const desc = document.createElement("span");
        desc.className = "navmenu__link-desc";
        desc.textContent = entry.description;
        a.appendChild(desc);
      }
      li.appendChild(a);
      links.appendChild(li);
    }
    panel.appendChild(links);
    // Hoverable: moving onto the panel keeps it open.
    panel.addEventListener("pointerenter", () => this.#hold());
    panel.addEventListener("pointerleave", this.#scheduleClose);
    // Escape inside the panel returns focus to its trigger.
    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") trigger.focus();
    });
    // The panel follows its trigger in the tree, so Tab moves from the
    // trigger into the links.
    trigger.after(panel);
    this.#panel = panel;

    const stopFloating = attachFloating(trigger, panel, { placement: "bottom-start", offset: 8 });
    const onOutside = (event: Event) => {
      const target = event.target as Node;
      if (trigger.contains(target) || panel.contains(target)) return;
      this.#setValue(null, true);
    };
    document.addEventListener("pointerdown", onOutside, true);
    this.#cleanup = () => {
      stopFloating();
      document.removeEventListener("pointerdown", onOutside, true);
    };
  }

  #apply() {
    const nav = this.#nav!;
    nav.setAttribute("aria-label", this.getAttribute("label") ?? "");
    const open = this.#items.find((item) => item.value === this.#value && item.links);
    if (!open || this.#panel?.dataset.value !== open.value) {
      this.#closePanel();
      const trigger = open ? this.#triggers.get(open.value) : undefined;
      if (open && trigger) {
        this.#openPanel(open, trigger);
        this.#panel!.dataset.value = open.value;
      }
    }
    const api = this.#api();
    for (const [value, trigger] of this.#triggers) applyProps(trigger, api.getTriggerProps(value));
    if (this.#panel) applyProps(this.#panel, api.getContentProps(this.#panel.dataset.value!));
  }
}
