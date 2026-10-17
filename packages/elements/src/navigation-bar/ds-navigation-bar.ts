import { navigationBar as core } from "@invisible-ui/core";
import {
  applyProps,
  emit,
  HTMLElementBase,
  nextId,
  setChildren,
  upgradeProperty,
} from "../internal/base";
import { localized, onLocaleChange, t } from "../internal/i18n";
import { pathIcon } from "../internal/icons";
import { BadgeLive } from "../internal/badge-live";

export type NavigationBadge = core.NavigationBadge;

/** One destination: `icon` is SVG path data on a 24 by 24 grid, decorative. */
export type NavigationDestination = core.NavigationDestination<string>;

const LOCK =
  "M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7a4 4 0 0 1 8 0v4";

const span = (className: string, text?: string) => {
  const node = document.createElement("span");
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const glyph = (d: string) => {
  const svg = pathIcon(d);
  svg.setAttribute("width", "1em");
  svg.setAttribute("height", "1em");
  return svg;
};

/**
 * `<ds-navigation-bar>` — primary navigation between a few top-level
 * sections, ported from the Svelte adapter with identical classes. A `<nav>`
 * landmark around a list of destinations, each an icon above a visible label.
 * A destination with an `href` is a link the browser or the router follows;
 * one without is a button that emits `select`, again when it is already
 * current. The current destination is the application's `value`, marked with
 * `aria-current="page"`, a shape behind the icon and a heavier label.
 *
 * Every destination is a tab stop; the left and right arrows move between
 * them as well, mirrored under right to left, without wrapping. An
 * unavailable destination stays focusable with its reason read as its
 * description. A badge's text is part of the name, and a badge that appears
 * or changes is announced politely once (`announce: false` silences it);
 * while a modal dialog is open the announcement waits for it to close
 * (ADR 0016). The element reads no screen size.
 *
 * Attributes: `label` (the landmark name; "Main" by default), `value` (the
 * current destination), `unavailable-icon` (SVG path data replacing the lock
 * glyph). Properties: `destinations`, `value`.
 * Emits: bubbling `select` (`detail.value`, destinations without `href`).
 */
export class DsNavigationBar extends HTMLElementBase {
  static observedAttributes = ["label", "value", "unavailable-icon"];

  #destinations: NavigationDestination[] = [];
  #nav: HTMLElement | null = null;
  #list: HTMLUListElement | null = null;
  #live: BadgeLive | null = null;
  #id = nextId("ds-navigation-bar");

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#nav) this.#render();
    });
  }

  connectedCallback() {
    for (const property of ["destinations", "value"]) upgradeProperty(this, property);
    if (!this.#nav) {
      this.#nav = document.createElement("nav");
      this.#nav.className = "navigation-bar";
      this.#list = document.createElement("ul");
      this.#list.className = "navigation-bar__list";
      this.#live = new BadgeLive("navigation-bar__live");
      this.#nav.append(this.#list, this.#live.node);
      this.appendChild(this.#nav);
    }
    this.#live!.connect();
    this.#render();
    // The first destinations given, before or after the element connects,
    // are the first render: nothing is announced for them.
    this.#live!.reset(this.#destinations);
  }

  disconnectedCallback() {
    this.#live?.disconnect();
  }

  attributeChangedCallback() {
    if (this.#nav) this.#render();
  }

  get destinations(): NavigationDestination[] {
    return this.#destinations;
  }
  set destinations(value: NavigationDestination[]) {
    this.#destinations = Array.isArray(value) ? value : [];
    if (!this.#nav) return;
    this.#render();
    // A badge that appears or changes is announced once.
    this.#live!.update(this.#destinations, (key, vars) => t(this, key, vars));
  }

  get value(): string | null {
    return this.getAttribute("value");
  }
  set value(next: string | null) {
    if (next == null) this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  #destination(api: core.NavigationBarApi, destination: NavigationDestination) {
    const { badge, unavailable } = destination;
    const item = document.createElement("li");
    item.className = "navigation-bar__item";
    const node = document.createElement(destination.href === undefined ? "button" : "a");
    node.className = "navigation-bar__destination";
    node.dataset.focusKey = destination.value;
    applyProps(node, api.getDestinationProps(destination.value));

    const indicator = span("navigation-bar__indicator");
    indicator.setAttribute("aria-hidden", "true");
    const icon = span("navigation-bar__icon");
    icon.appendChild(glyph(destination.icon));
    indicator.appendChild(icon);
    if (badge) {
      indicator.appendChild(
        span(
          badge.content === undefined
            ? "navigation-bar__badge navigation-bar__badge--dot"
            : "navigation-bar__badge",
          badge.content ?? "",
        ),
      );
    }
    if (unavailable) {
      const status = span("navigation-bar__status");
      status.appendChild(glyph(this.getAttribute("unavailable-icon") ?? LOCK));
      indicator.appendChild(status);
    }

    const label = span("navigation-bar__label");
    label.dataset.label = destination.label;
    const text = span("navigation-bar__label-text", destination.label);
    if (badge) text.appendChild(span("navigation-bar__hidden", `, ${badge.label}`));
    label.appendChild(text);
    node.append(indicator, label);
    item.appendChild(node);

    if (unavailable) {
      const reason = span("navigation-bar__reason", unavailable.reason);
      applyProps(reason, api.getReasonProps(destination.value));
      item.appendChild(reason);
    }
    return item;
  }

  #render() {
    const nav = this.#nav!;
    const list = this.#list!;
    // The destinations are rebuilt; focus goes back to the one that held it.
    const focused = (document.activeElement as HTMLElement | null)?.dataset?.focusKey;
    const refocus = focused !== undefined && list.contains(document.activeElement);
    const api = core.connect({
      destinations: this.#destinations,
      value: this.value,
      label: localized(this, "label", "navigationBar.label"),
      id: this.#id,
      onSelect: (value) => emit(this, "select", { value }),
    });
    applyProps(nav, api.getRootProps());
    applyProps(list, api.getListProps());
    setChildren(
      list,
      this.#destinations.map((destination) => this.#destination(api, destination)),
    );
    if (refocus) {
      Array.from(list.querySelectorAll<HTMLElement>("[data-focus-key]"))
        .find((node) => node.dataset.focusKey === focused)
        ?.focus();
    }
  }
}
