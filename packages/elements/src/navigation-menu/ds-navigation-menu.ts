import { navigationMenu as core } from "@design-system/core";
import {
  applyProps,
  emit,
  FOCUSABLE,
  HTMLElementBase,
  nextId,
  numberAttr,
  upgradeProperty,
} from "../internal/base";
import { attachFloating } from "../internal/floating";
import { HoverDelay } from "../internal/hover-delay";
import { pathIcon } from "../internal/icons";
import { onOutside } from "../internal/outside";

/** A link inside a navigation menu panel. */
export interface NavigationMenuLink {
  label: string;
  href: string;
  description?: string;
  /** Whether the link points to the page on screen. */
  current?: boolean;
}

/** A top-level item: a plain link (`href`) or a panel item revealing `links`. */
export interface NavigationMenuItem {
  value: string;
  label: string;
  href?: string;
  links?: NavigationMenuLink[];
  /** Whether this plain link points to the page on screen. */
  current?: boolean;
}

const CHEVRON_DOWN = "M6 9l6 6 6-6";

/**
 * `<ds-navigation-menu>` — a site navigation bar where some items reveal a
 * panel of links. Ported from the Vue adapter, class names kept identical.
 * Plain items are ordinary links; panel items are disclosures, at most one
 * open. State and ARIA come from the headless navigation menu; this element
 * adds hover timing, Floating UI positioning, dismissal on an outside press,
 * and focus movement.
 *
 * The pointer resting on a trigger opens its panel after `open-delay`
 * (switching between open panels is immediate), and leaving the trigger and
 * the panel closes it after `close-delay`. A press on a trigger (click, tap,
 * Enter, Space) keeps the panel open, also one hover opened; a second press,
 * Escape or a press outside closes it, and hover does not reopen it until
 * the pointer enters a trigger again. ArrowDown opens and moves into the
 * panel; Escape closes and returns focus to the trigger.
 *
 * Mark the link to the page on screen with `current: true`, on a panel link
 * or a plain item: it gets `aria-current="page"`, and the trigger whose panel
 * holds it is marked for styling only. Following a link closes the panel.
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
  /** Whether a press keeps the open panel open (the core's `kept`). */
  #kept = false;
  #id = nextId("ds-navigation-menu");
  #nav: HTMLElement | null = null;
  #triggers = new Map<string, HTMLButtonElement>();
  #topLinks = new Map<HTMLAnchorElement, NavigationMenuItem>();
  #panelLinks = new Map<HTMLAnchorElement, NavigationMenuLink>();
  #panel: HTMLDivElement | null = null;
  #delay = new HoverDelay();
  #cleanup: (() => void) | null = null;
  #warnedLabel = false;

  connectedCallback() {
    upgradeProperty(this, "items");
    upgradeProperty(this, "value");
    if (!this.#nav) {
      this.#nav = document.createElement("nav");
      this.#nav.className = "navmenu";
      this.appendChild(this.#nav);
      this.#value = this.getAttribute("value");
      // An item open from the start waits for the user to close it.
      this.#kept = this.#value !== null;
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
    if (name === "value") this.#adopt(this.getAttribute("value"));
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
    this.#adopt(next ?? null);
  }

  #api() {
    return core.connect({
      state: { value: this.#value, kept: this.#kept, id: this.#id },
      setValue: (next, kept) => this.#setValue(next, kept, true),
    });
  }

  /** A value set by the page: an open item waits for the user to close it. */
  #adopt(next: string | null) {
    if (next === this.#value) return;
    this.#setValue(next, next !== null, false);
  }

  #setValue(next: string | null, kept: boolean, report: boolean) {
    const changed = this.#value !== next;
    if (!changed && this.#kept === kept) return;
    this.#kept = kept;
    this.#value = next;
    if (changed) {
      if (next == null) this.removeAttribute("value");
      else if (this.getAttribute("value") !== next) this.setAttribute("value", next);
    }
    if (changed && report) emit(this, "value-change", { value: next });
    // Re-applied for `kept` alone too: the handlers read it from their bag.
    this.#apply();
  }

  #hold() {
    this.#delay.cancel();
  }

  // The core ignores the close while a press keeps the panel open.
  #scheduleClose = () => {
    this.#delay.schedule(numberAttr(this, "close-delay", 150), () => this.#api().hoverClose());
  };

  #onTriggerEnter(value: string, event: PointerEvent) {
    // Touch has no hover: a tap fires pointerenter and click, and the click
    // owns touch, so the panel does not flash open and closed.
    if (event.pointerType === "touch") return;
    this.#hold();
    if (this.#value !== null) this.#api().hoverOpen(value);
    else {
      this.#delay.schedule(numberAttr(this, "open-delay", 150), () => this.#api().hoverOpen(value));
    }
  }

  /**
   * After a link click closed the panel, the page usually moves focus. When
   * nothing did and focus fell to the body with the removed panel, put it
   * back on the trigger rather than lose it.
   */
  #keepFocus(trigger: HTMLButtonElement) {
    setTimeout(() => {
      const active = document.activeElement;
      if ((active === null || active === document.body) && trigger.isConnected) trigger.focus();
    });
  }

  #renderItems() {
    const nav = this.#nav!;
    nav.textContent = "";
    this.#triggers.clear();
    this.#topLinks.clear();
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
        // A press decides on its own: a hover open still waiting must not
        // undo it.
        trigger.addEventListener("click", () => this.#hold());
        // ArrowDown also moves focus into the panel. This listener runs before
        // the core's, and a browser runs microtasks between listeners, so the
        // panel is opened here rather than awaited; the core's open is then a
        // no-op.
        trigger.addEventListener("keydown", (event) => {
          if (event.key === "Escape") this.#hold();
          if (event.key !== "ArrowDown") return;
          this.#api().open(item.value);
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
        this.#topLinks.set(link, item);
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
    this.#panelLinks.clear();
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
      a.addEventListener("click", () => this.#keepFocus(trigger));
      this.#panelLinks.set(a, entry);
      li.appendChild(a);
      links.appendChild(li);
    }
    panel.appendChild(links);
    // Hoverable: moving onto the panel keeps it open.
    panel.addEventListener("pointerenter", () => this.#hold());
    panel.addEventListener("pointerleave", this.#scheduleClose);
    // Escape inside the panel returns focus to its trigger.
    panel.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      this.#hold();
      trigger.focus();
    });
    // The panel follows its trigger in the tree, so Tab moves from the
    // trigger into the links.
    trigger.after(panel);
    this.#panel = panel;

    const stopFloating = attachFloating(trigger, panel, { placement: "bottom-start", offset: 8 });
    const stopOutside = onOutside([trigger, panel], () => {
      this.#hold();
      this.#api().close();
    });
    // Tab out of the trigger and panel closes; focus stays where it went.
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (next && !trigger.contains(next) && !panel.contains(next)) this.#api().close();
    };
    trigger.addEventListener("focusout", onFocusOut);
    panel.addEventListener("focusout", onFocusOut);
    this.#cleanup = () => {
      stopFloating();
      stopOutside();
      trigger.removeEventListener("focusout", onFocusOut);
      panel.removeEventListener("focusout", onFocusOut);
      // A hover delay still pending, such as the one a pointer click starts,
      // must not reopen a panel that has just closed.
      this.#hold();
    };
  }

  #apply() {
    const nav = this.#nav!;
    const label = this.getAttribute("label");
    if (label) nav.setAttribute("aria-label", label);
    else {
      nav.removeAttribute("aria-label");
      if (!this.#warnedLabel) {
        this.#warnedLabel = true;
        console.warn("[ds] <ds-navigation-menu> needs a label attribute to name its landmark.");
      }
    }
    const open = this.#items.find((item) => item.value === this.#value && item.links);
    if (!open || this.#panel?.dataset.value !== open.value) {
      this.#closePanel();
      const trigger = open ? this.#triggers.get(open.value) : undefined;
      if (open && trigger) {
        this.#openPanel(open, trigger);
        this.#panel!.dataset.value = open.value;
      }
    }
    // Applied again on every change: each bag's handlers close over the
    // state they were made from.
    const api = this.#api();
    for (const [value, trigger] of this.#triggers) {
      const item = this.#items.find((entry) => entry.value === value);
      const holdsCurrent = item?.links?.some((link) => link.current) ?? false;
      applyProps(trigger, api.getTriggerProps(value, { holdsCurrent }));
    }
    for (const [link, item] of this.#topLinks) {
      applyProps(link, api.getLinkProps({ current: item.current }));
    }
    for (const [link, entry] of this.#panelLinks) {
      applyProps(link, api.getLinkProps({ current: entry.current }));
    }
    if (this.#panel) applyProps(this.#panel, api.getContentProps(this.#panel.dataset.value!));
  }
}
