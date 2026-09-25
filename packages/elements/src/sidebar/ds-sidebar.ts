import { collapsible } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { localized, onLocaleChange } from "../internal/i18n";
import { pathIcon } from "../internal/icons";

/** One destination in the sidebar. */
export interface SidebarItem {
  value: string;
  label: string;
  /** Renders the item as a link. Without it the item emits `select`. */
  href?: string;
  /** Optional leading icon, as SVG path data on a 24 by 24 grid. */
  icon?: string;
}

/** A group of destinations under an optional heading. */
export interface SidebarSection {
  label?: string;
  items: SidebarItem[];
  /** The heading becomes a disclosure; `id` names the section in `openGroups`. */
  collapsible?: boolean;
  id?: string;
  /** Open on first render. A section holding the current item opens anyway. */
  defaultOpen?: boolean;
}

const CHEVRON_RIGHT = "M9 18l6-6-6-6";
const CHEVRON_LEFT = "M15 18l-6-6 6-6";

/**
 * `<ds-sidebar>` — the application's side navigation, ported from the Svelte
 * adapter with identical classes: an optional logo, labelled sections of items
 * (icon and label), and a footer. Items are links when they carry an `href`,
 * otherwise buttons that emit `select`. The current destination is marked with
 * `aria-current="page"`.
 *
 * The routing, which destination is current and which viewport gets which
 * presentation stay with the application. Sections can collapse, and the bar
 * can collapse to a rail of icons when every destination has one. For a
 * drawer, put the element inside a `<ds-sheet-dialog>` and close it on
 * `navigate`.
 *
 * Attributes: `label` (the landmark name; "Main" by default), `value` (the
 * current destination), `collapsed` (the rail), `rail-toggle` (renders the
 * button that collapses and expands the rail), `side` (inline-start|inline-end),
 * `collapse-label`, `expand-label`.
 * Properties: `sections`, `value`, `openGroups` (ids of the open sections).
 * Regions: `slot="logo"`, `slot="footer"`.
 * Emits: bubbling `select` (`detail.value`, items without `href`), `navigate`
 * (`detail.value`, every item), `collapsed-change` (`detail.collapsed`) and
 * `open-groups-change` (`detail.openGroups`).
 */
export class DsSidebar extends HTMLElementBase {
  static observedAttributes = [
    "label",
    "value",
    "collapsed",
    "rail-toggle",
    "side",
    "collapse-label",
    "expand-label",
  ];

  #sections: SidebarSection[] = [];
  #openGroups: string[] | null = null;
  #nav: HTMLElement | null = null;
  #logo: Element[] = [];
  #footer: Element[] = [];
  #groupIds = new Map<string, string>();

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#nav) this.#render();
    });
  }

  connectedCallback() {
    for (const property of ["sections", "value", "openGroups"]) upgradeProperty(this, property);
    if (!this.#nav) {
      this.#logo = this.#takeSlot("logo");
      this.#footer = this.#takeSlot("footer");
      this.#nav = document.createElement("nav");
      this.appendChild(this.#nav);
    }
    this.#render();
  }

  attributeChangedCallback(name: string) {
    if (!this.#nav) return;
    // A new current destination opens the section that holds it.
    if (name === "value") this.#openHolder();
    this.#render();
  }

  get sections(): SidebarSection[] {
    return this.#sections;
  }
  set sections(value: SidebarSection[]) {
    this.#sections = Array.isArray(value) ? value : [];
    if (this.#openGroups === null) this.#openGroups = this.#initialGroups();
    if (this.#nav) this.#render();
  }

  get value(): string | null {
    return this.getAttribute("value");
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  get openGroups(): string[] {
    return this.#openGroups ?? this.#initialGroups();
  }
  set openGroups(value: string[]) {
    this.#openGroups = Array.isArray(value) ? [...value] : [];
    if (this.#nav) this.#render();
  }

  #takeSlot(name: string): Element[] {
    const claimed = Array.from(this.children).filter(
      (child) => child.getAttribute("slot") === name,
    );
    for (const child of claimed) {
      child.removeAttribute("slot");
      child.remove();
    }
    return claimed;
  }

  #sectionId(section: SidebarSection, index: number) {
    return section.collapsible && section.id ? section.id : String(index);
  }

  #holds(section: SidebarSection) {
    const current = this.value;
    return current != null && section.items.some((item) => item.value === current);
  }

  #initialGroups(): string[] {
    return this.#sections
      .map((section, index) => ({ section, id: this.#sectionId(section, index) }))
      .filter(({ section }) => section.collapsible && (section.defaultOpen || this.#holds(section)))
      .map(({ id }) => id);
  }

  #openHolder() {
    const holder = this.#sections.findIndex((s) => s.collapsible && this.#holds(s));
    if (holder < 0) return;
    const id = this.#sectionId(this.#sections[holder]!, holder);
    const open = this.openGroups;
    if (!open.includes(id)) this.#openGroups = [...open, id];
  }

  /** The rail is only offered when every destination shows an icon. */
  #railable() {
    return this.#sections.every((section) => section.items.every((item) => item.icon));
  }

  #isRail() {
    return boolAttr(this, "collapsed") && this.#railable();
  }

  #setCollapsed(next: boolean) {
    this.toggleAttribute("collapsed", next);
    emit(this, "collapsed-change", { collapsed: next });
  }

  #toggleGroup(id: string) {
    const open = this.openGroups;
    // Pressing a section on the rail opens the bar first: its items would
    // otherwise expand into a column too narrow to read them.
    if (this.#isRail()) {
      this.#setCollapsed(false);
      if (open.includes(id)) return;
    }
    const next = open.includes(id) ? open.filter((g) => g !== id) : [...open, id];
    this.#openGroups = next;
    emit(this, "open-groups-change", { openGroups: next });
    this.#render();
  }

  #label(text: string, hidden: boolean, className = "sidebar__label") {
    const span = document.createElement("span");
    span.className = hidden ? "sidebar__label--hidden" : className;
    span.textContent = text;
    return span;
  }

  #icon(d: string) {
    const span = document.createElement("span");
    span.className = "sidebar__icon";
    span.setAttribute("aria-hidden", "true");
    span.appendChild(pathIcon(d));
    return span;
  }

  #item(entry: SidebarItem, rail: boolean) {
    const current = entry.value === this.value;
    const node = document.createElement(entry.href ? "a" : "button");
    node.className = current ? "sidebar__item sidebar__item--active" : "sidebar__item";
    node.dataset.focusKey = `item:${entry.value}`;
    if (current) {
      node.setAttribute("aria-current", "page");
      node.dataset.current = "";
    }
    if (node instanceof HTMLAnchorElement) node.href = entry.href!;
    else (node as HTMLButtonElement).type = "button";
    if (entry.icon) node.appendChild(this.#icon(entry.icon));
    node.appendChild(this.#label(entry.label, rail));
    node.addEventListener("click", () => {
      if (!entry.href) emit(this, "select", { value: entry.value });
      emit(this, "navigate", { value: entry.value });
    });
    return node;
  }

  #list(section: SidebarSection, rail: boolean) {
    const list = document.createElement("ul");
    list.className = rail ? "sidebar__list sidebar__list--collapsed" : "sidebar__list";
    for (const entry of section.items) {
      const li = document.createElement("li");
      li.appendChild(this.#item(entry, rail));
      list.appendChild(li);
    }
    return list;
  }

  #group(section: SidebarSection, id: string, rail: boolean) {
    const open = this.openGroups.includes(id);
    let baseId = this.#groupIds.get(id);
    if (!baseId) {
      baseId = nextId("ds-sidebar-group");
      this.#groupIds.set(id, baseId);
    }
    const api = collapsible.connect({
      state: { open, disabled: false, id: baseId },
      setOpen: () => this.#toggleGroup(id),
    });

    const wrapper = document.createElement("div");
    wrapper.className = "sidebar__section";
    wrapper.dataset.state = open ? "open" : "closed";

    const trigger = document.createElement("button");
    applyProps(trigger, api.triggerProps);
    trigger.className = "sidebar__group";
    trigger.dataset.focusKey = `group:${id}`;
    trigger.appendChild(this.#label(section.label ?? "", rail, "sidebar__group-label"));
    const chevron = document.createElement("span");
    chevron.className = open ? "sidebar__chevron sidebar__chevron--open" : "sidebar__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.appendChild(pathIcon(CHEVRON_RIGHT));
    trigger.appendChild(chevron);

    const content = document.createElement("div");
    applyProps(content, api.contentProps);
    content.className = "sidebar__group-content";
    content.appendChild(this.#list(section, rail));

    wrapper.append(trigger, content);
    return wrapper;
  }

  #render() {
    const nav = this.#nav!;
    // The whole bar is rebuilt; focus goes back to the control that held it.
    const focused = (document.activeElement as HTMLElement | null)?.dataset?.focusKey;
    const rail = this.#isRail();

    nav.className = rail ? "sidebar sidebar--collapsed" : "sidebar";
    nav.setAttribute("aria-label", localized(this, "label", "sidebar.label"));
    nav.dataset.mode = "inline";
    nav.dataset.side = this.getAttribute("side") === "inline-end" ? "inline-end" : "inline-start";
    nav.toggleAttribute("data-collapsed", rail);
    nav.textContent = "";

    if (this.#logo.length > 0) {
      const logo = document.createElement("div");
      logo.className = "sidebar__logo";
      logo.append(...this.#logo);
      nav.appendChild(logo);
    }

    if (boolAttr(this, "rail-toggle") && this.#railable()) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "sidebar__rail-toggle";
      toggle.dataset.focusKey = "rail-toggle";
      toggle.setAttribute("aria-pressed", String(rail));
      toggle.appendChild(this.#icon(rail ? CHEVRON_RIGHT : CHEVRON_LEFT));
      const text = rail
        ? localized(this, "expand-label", "sidebar.expand")
        : localized(this, "collapse-label", "sidebar.collapse");
      toggle.appendChild(this.#label(text, true));
      toggle.addEventListener("click", () => this.#setCollapsed(!rail));
      nav.appendChild(toggle);
    }

    this.#sections.forEach((section, index) => {
      const id = this.#sectionId(section, index);
      if (section.collapsible && section.label) {
        nav.appendChild(this.#group(section, id, rail));
        return;
      }
      const wrapper = document.createElement("div");
      wrapper.className = "sidebar__section";
      if (section.label) {
        const heading = document.createElement("p");
        heading.className = rail
          ? "sidebar__section-label sidebar__label--hidden"
          : "sidebar__section-label";
        heading.textContent = section.label;
        wrapper.appendChild(heading);
      }
      wrapper.appendChild(this.#list(section, rail));
      nav.appendChild(wrapper);
    });

    if (this.#footer.length > 0) {
      const footer = document.createElement("div");
      footer.className = "sidebar__footer";
      footer.append(...this.#footer);
      nav.appendChild(footer);
    }

    if (focused) {
      nav.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focused)}"]`)?.focus();
    }
  }
}
