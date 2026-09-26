import { accordion as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  definePart,
  emit,
  HTMLElementBase,
  upgradeProperty,
} from "../internal/base";
import { DsAccordionItem } from "./accordion-item";

export type AccordionType = core.AccordionType;

/** An item, with an optional header label and its panel text. */
export type AccordionEntry = core.AccordionItem & { label?: string; content?: string };

const parseValue = (raw: string | null): string[] =>
  raw
    ? raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

/**
 * `<ds-accordion>` — the WAI-ARIA accordion pattern, ported from the Svelte
 * adapter with identical classes: header buttons that show and hide their
 * panels, one at a time or several, with arrow-key movement between headers.
 * Behaviour and accessibility come from the headless accordion in
 * `@design-system/core`.
 *
 * Write the items as `<ds-accordion-item value label>` children: each one's
 * own children are its panel content. As a shortcut, assign `items` (the
 * Svelte data shape, with text content) and the element renders the items
 * itself, in place of any it holds.
 *
 * Attributes: `value` (the expanded values, comma-separated), `type`
 * (single|multiple), `collapsible` (single only: the open item can close; on
 * by default, `collapsible="false"` turns it off), `disabled`.
 * Properties: `value` (string[]), `items`.
 * Emits: bubbling `change` CustomEvent with `detail.value` (string[]).
 */
export class DsAccordion extends HTMLElementBase {
  static observedAttributes = ["value", "type", "collapsible", "disabled"];

  #value: string[] = [];
  #entries: AccordionEntry[] | null = null;
  #entriesRendered = false;
  #triggers = new Map<string, HTMLButtonElement>();
  #id = core.initialState({ items: [] }).id;

  connectedCallback() {
    for (const property of ["items", "value"]) upgradeProperty(this, property);
    this.classList.add("accordion");
    this.#value = parseValue(this.getAttribute("value"));
    if (this.#entries && !this.#entriesRendered) this.#renderEntries();
    this.syncItems();
  }

  attributeChangedCallback(name: string) {
    if (name === "value") this.#value = parseValue(this.getAttribute("value"));
    if (this.isConnected) this.syncItems();
  }

  get value(): string[] {
    return [...this.#value];
  }
  set value(next: string[]) {
    this.setAttribute("value", (Array.isArray(next) ? next : []).join(","));
  }

  get items(): AccordionEntry[] {
    return this.#entries ?? this.#own().map((item) => this.#entryOf(item));
  }
  set items(value: AccordionEntry[]) {
    this.#entries = Array.isArray(value) ? value : [];
    this.#entriesRendered = false;
    if (this.isConnected) this.#renderEntries();
  }

  /** The items this accordion owns; a nested `<ds-accordion>` keeps its own. */
  #own(): DsAccordionItem[] {
    return Array.from(this.querySelectorAll<DsAccordionItem>("ds-accordion-item")).filter(
      (item) => item.parentElement?.closest("ds-accordion") === this && item.trigger,
    );
  }

  #entryOf(item: Element): AccordionEntry {
    return {
      value: item.getAttribute("value") ?? "",
      label: item.getAttribute("label") ?? undefined,
      disabled: item.hasAttribute("disabled"),
    };
  }

  #renderEntries() {
    // Registered here too, so a selective import of the accordion works.
    definePart("ds-accordion-item", DsAccordionItem);
    const nodes = this.#entries!.map((entry) => {
      const item = document.createElement("ds-accordion-item");
      item.setAttribute("value", entry.value);
      if (entry.label != null) item.setAttribute("label", entry.label);
      if (entry.disabled) item.setAttribute("disabled", "");
      item.textContent = entry.content ?? "";
      return item;
    });
    for (const item of this.#own()) item.remove();
    this.#entriesRendered = true;
    this.append(...nodes);
  }

  #type(): AccordionType {
    return this.getAttribute("type") === "multiple" ? "multiple" : "single";
  }

  /** Re-wire every item. Called by the items when they arrive, leave or change. */
  syncItems() {
    if (!this.isConnected) return;
    const items = this.#own();
    const entries = items.map((item) => this.#entryOf(item));
    this.#triggers = new Map(items.map((item, index) => [entries[index]!.value, item.trigger!]));

    const api = core.connect({
      state: {
        value: this.#value,
        items: entries.map(({ value, disabled }) => ({ value, disabled })),
        type: this.#type(),
        collapsible: boolAttr(this, "collapsible", true),
        disabled: boolAttr(this, "disabled"),
        orientation: "vertical",
        id: this.#id,
      },
      setValue: (next) => {
        const same =
          next.length === this.#value.length && next.every((v) => this.#value.includes(v));
        if (same) return;
        this.#value = next;
        this.setAttribute("value", next.join(","));
        emit(this, "change", { value: [...next] });
      },
      focus: (value) => this.#triggers.get(value)?.focus(),
    });

    applyProps(this, api.rootProps);
    items.forEach((item, index) => {
      const value = entries[index]!.value;
      applyProps(item, api.getItemProps(value));
      applyProps(item.trigger!, api.getTriggerProps(value));
      applyProps(item.panel!, api.getPanelProps(value));
    });
  }
}
