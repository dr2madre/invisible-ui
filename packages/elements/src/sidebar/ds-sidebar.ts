import { collapsible, navigationBar } from "@invisible-ui/core";
import {
  applyProps,
  boolAttr,
  definePart,
  emit,
  HTMLElementBase,
  nextId,
  setChildren,
  upgradeProperty,
} from "../internal/base";
import { BadgeLive } from "../internal/badge-live";
import { localized, onLocaleChange, t } from "../internal/i18n";
import { pathIcon } from "../internal/icons";
import { DsTooltip } from "../tooltip/ds-tooltip";

/**
 * One destination in the sidebar: the Navigation Bar's destination with an
 * optional icon, so the same list serves both. `href` renders a link; without
 * it the item emits `select`. A `badge` adds its text to the name and is
 * announced when it appears or changes; `unavailable` keeps the item visible
 * and focusable with its reason, and activation does nothing.
 */
export interface SidebarItem extends navigationBar.NavigationTarget {
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
const LOCK =
  "M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7a4 4 0 0 1 8 0v4";

/**
 * `<ds-sidebar>` — the application's side navigation, ported from the Svelte
 * adapter with identical classes: an optional logo, labelled sections of items
 * (icon and label), and a footer. Items are links when they carry an `href`,
 * otherwise buttons that emit `select`. The current destination is marked with
 * `aria-current="page"`.
 *
 * The routing, which destination is current and which viewport gets which
 * presentation stay with the application. Sections can collapse, and the bar
 * can collapse to a rail of icons when every destination has one; on the
 * rail each name comes back as a `<ds-tooltip>` on hover and focus. For a
 * drawer, put the element inside a `<ds-sheet-dialog>` and close it on
 * `navigate`.
 *
 * Items take the Navigation Bar's destinations as they are. A `badge` shows a
 * count or a dot, its text is part of the item's name, and when it appears or
 * changes it is announced politely once (`announce: false` silences it); while
 * a modal dialog outside the sidebar is open the announcement waits for it to
 * close (ADR 0016). An `unavailable` item stays visible and focusable with its
 * reason shown and read as its description, and emits nothing when activated.
 * To hide a destination, leave it out.
 *
 * Attributes: `label` (the landmark name; "Main" by default), `value` (the
 * current destination), `collapsed` (the rail), `rail-toggle` (renders the
 * button that collapses and expands the rail), `side` (inline-start|inline-end),
 * `collapse-label` (the rail toggle's name, the same in both states: the
 * button reports the rail through `aria-pressed`).
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
  ];

  #sections: SidebarSection[] = [];
  #openGroups: string[] | null = null;
  #nav: HTMLElement | null = null;
  #logo: Element[] = [];
  #footer: Element[] = [];
  /** The regions stay in place across renders, so what they hold keeps its state. */
  #logoRegion: HTMLDivElement | null = null;
  #footerRegion: HTMLDivElement | null = null;
  #groupIds = new Map<string, string>();
  #id = nextId("ds-sidebar");
  /** The live region stays in place across renders, so it can announce. */
  #live: BadgeLive | null = null;

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
      this.#live = new BadgeLive("sidebar__live");
      this.appendChild(this.#nav);
    }
    this.#live!.connect();
    this.#render();
    // The first sections given, before or after the element connects, are the
    // first render: nothing is announced for them.
    this.#live!.reset(this.#items());
  }

  disconnectedCallback() {
    this.#live?.disconnect();
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
    if (!this.#nav) return;
    this.#render();
    // A badge that appears or changes is announced once.
    this.#live!.update(this.#items(), (key, vars) => t(this, key, vars));
  }

  #items() {
    return this.#sections.flatMap((section) => section.items);
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

  #span(className: string, text?: string) {
    const span = document.createElement("span");
    span.className = className;
    if (text !== undefined) span.textContent = text;
    return span;
  }

  #item(entry: SidebarItem, rail: boolean, reasonId: string) {
    const current = entry.value === this.value;
    const { badge, unavailable } = entry;
    const node = document.createElement(entry.href === undefined ? "button" : "a");
    node.className = current ? "sidebar__item sidebar__item--active" : "sidebar__item";
    node.dataset.focusKey = `item:${entry.value}`;
    applyProps(
      node,
      navigationBar.destinationProps({
        destination: entry,
        current,
        reasonId,
        onSelect: (value) => emit(this, "select", { value }),
        onNavigate: () => emit(this, "navigate", { value: entry.value }),
      }),
    );
    if (entry.icon) node.appendChild(this.#icon(entry.icon));
    const label = this.#label(entry.label, rail);
    if (badge) label.appendChild(this.#span("sidebar__label--hidden", `, ${badge.label}`));
    if (unavailable) {
      const reason = this.#span("sidebar__reason", unavailable.reason);
      reason.id = reasonId;
      reason.setAttribute("aria-hidden", "true");
      label.appendChild(reason);
    }
    node.appendChild(label);
    if (unavailable) {
      const status = this.#span("sidebar__status");
      status.setAttribute("aria-hidden", "true");
      const lock = pathIcon(LOCK);
      lock.setAttribute("width", "1em");
      lock.setAttribute("height", "1em");
      status.appendChild(lock);
      node.appendChild(status);
    }
    if (badge) {
      const glyph = this.#span(
        badge.content === undefined ? "sidebar__badge sidebar__badge--dot" : "sidebar__badge",
        badge.content ?? "",
      );
      glyph.setAttribute("aria-hidden", "true");
      node.appendChild(glyph);
    }
    return node;
  }

  #list(section: SidebarSection, rail: boolean, sectionIndex: number) {
    const list = document.createElement("ul");
    list.className = rail ? "sidebar__list sidebar__list--collapsed" : "sidebar__list";
    section.items.forEach((entry, index) => {
      const li = document.createElement("li");
      const item = this.#item(entry, rail, `${this.#id}-reason-${sectionIndex}-${index}`);
      if (rail) {
        // Registered here too, so a selective import of the sidebar works.
        definePart("ds-tooltip", DsTooltip);
        // The rail hides names from sight, never from a screen reader, and the
        // tooltip gives them back to whoever is looking.
        const tooltip = document.createElement("ds-tooltip");
        tooltip.setAttribute(
          "text",
          entry.unavailable
            ? t(this, "sidebar.unavailableTooltip", {
                label: entry.label,
                reason: entry.unavailable.reason,
              })
            : entry.label,
        );
        tooltip.setAttribute("placement", "right");
        tooltip.appendChild(item);
        li.appendChild(tooltip);
      } else {
        li.appendChild(item);
      }
      list.appendChild(li);
    });
    return list;
  }

  #group(section: SidebarSection, id: string, rail: boolean, sectionIndex: number) {
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
    content.appendChild(this.#list(section, rail, sectionIndex));

    wrapper.append(trigger, content);
    return wrapper;
  }

  #render() {
    const nav = this.#nav!;
    // The sections are rebuilt; focus goes back to the control that held it.
    // The logo and footer regions stay attached, so their content keeps its
    // focus and state.
    const focused = (document.activeElement as HTMLElement | null)?.dataset?.focusKey;
    const rail = this.#isRail();

    nav.className = rail ? "sidebar sidebar--collapsed" : "sidebar";
    nav.setAttribute("aria-label", localized(this, "label", "sidebar.label"));
    nav.dataset.mode = "inline";
    nav.dataset.side = this.getAttribute("side") === "inline-end" ? "inline-end" : "inline-start";
    nav.toggleAttribute("data-collapsed", rail);
    const nodes: Node[] = [];

    if (this.#logo.length > 0) {
      if (!this.#logoRegion) {
        this.#logoRegion = document.createElement("div");
        this.#logoRegion.className = "sidebar__logo";
        this.#logoRegion.append(...this.#logo);
      }
      nodes.push(this.#logoRegion);
    }

    if (boolAttr(this, "rail-toggle") && this.#railable()) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "sidebar__rail-toggle";
      toggle.dataset.focusKey = "rail-toggle";
      toggle.setAttribute("aria-pressed", String(rail));
      toggle.appendChild(this.#icon(rail ? CHEVRON_RIGHT : CHEVRON_LEFT));
      // A toggle button keeps one name and reports its state through
      // aria-pressed; a name that swaps as well would contradict it.
      toggle.appendChild(this.#label(localized(this, "collapse-label", "sidebar.collapse"), true));
      toggle.addEventListener("click", () => this.#setCollapsed(!rail));
      nodes.push(toggle);
    }

    this.#sections.forEach((section, index) => {
      const id = this.#sectionId(section, index);
      if (section.collapsible && section.label) {
        nodes.push(this.#group(section, id, rail, index));
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
      wrapper.appendChild(this.#list(section, rail, index));
      nodes.push(wrapper);
    });

    if (this.#footer.length > 0) {
      if (!this.#footerRegion) {
        this.#footerRegion = document.createElement("div");
        this.#footerRegion.className = "sidebar__footer";
        this.#footerRegion.append(...this.#footer);
      }
      nodes.push(this.#footerRegion);
    }
    nodes.push(this.#live!.node);
    setChildren(nav, nodes);

    if (focused) {
      nav.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focused)}"]`)?.focus();
    }
  }
}
