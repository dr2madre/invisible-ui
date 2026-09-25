import { combobox, dialog as core } from "@design-system/core";
import { applyProps, boolAttr, emit, nextId, upgradeProperty } from "../internal/base";
import {
  createDialogHeader,
  syncDialogHeader,
  type DialogHeaderParts,
} from "../internal/dialog-header";
import { searchIcon } from "../internal/icons";
import { createButton, ModalHost } from "../internal/modal-host";
import { localized, t } from "../internal/i18n";

export interface SearchDialogItem {
  value: string;
  label?: string;
  disabled?: boolean;
  /** Section the result belongs to ("Pages"); ungrouped results come first. */
  group?: string;
  /** Shortcut hint shown on the result ("⌘S", or ["⌘", "S"] for a chord). */
  shortcut?: string | string[];
}

const labelOf = (item: SearchDialogItem) => item.label ?? item.value;

const defaultFilter = (items: SearchDialogItem[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => labelOf(item).toLowerCase().includes(q));
};

// Ungrouped results first, then one run per group in order of first
// appearance: keyboard navigation follows this order, so it must match what
// the grouped list shows.
const orderItems = (items: SearchDialogItem[]): SearchDialogItem[] => {
  const ungrouped: SearchDialogItem[] = [];
  const groups = new Map<string, SearchDialogItem[]>();
  for (const item of items) {
    if (!item.group) ungrouped.push(item);
    else groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  }
  return [...ungrouped, ...[...groups.values()].flat()];
};

/**
 * `<ds-search-dialog>` is a search combobox inside a modal dialog: type to
 * filter a list of results and pick one (the pattern often called a command
 * palette). The modal shell is the native `<dialog>` (ADR 0005); the input,
 * listbox and keyboard behaviour come from the headless combobox, with DOM
 * focus on the input and the highlight carried by `aria-activedescendant`. A
 * visually hidden `role="status"` region announces the result count.
 *
 * Results come from the `items` property. `suggestions` are shown while the
 * query is empty (recent searches, for example); without them an empty query
 * shows every item. Choosing a result emits `select` and closes. Each opening
 * starts from a blank query with the input focused. Any keyboard shortcut
 * that opens the dialog belongs to the application.
 *
 * The header is the one the dialog family shares. By default it only names
 * the dialog: `hide-title="false"` shows the title and `close-button` adds a
 * close button above the search field.
 *
 * Attributes: `heading` ("Search" by default), `hide-title` (`"false"` shows
 * the title), `label` (the input's accessible name, "Search" by default),
 * `placeholder`, `empty-text`, `loading` (results are being fetched),
 * `trigger` (opener text), `trigger-variant`, `open`, `close-button`,
 * `close-label`.
 * Properties: `open` (boolean), `items` and `suggestions` (arrays of
 * `{ value, label?, disabled?, group?, shortcut? }`).
 * Emits: bubbling `open-change` CustomEvent with `detail.open`, and `select`
 * with `detail.value` when a result is chosen.
 */
export class DsSearchDialog extends ModalHost {
  static observedAttributes = [
    "open",
    "heading",
    "hide-title",
    "label",
    "placeholder",
    "empty-text",
    "loading",
    "trigger",
    "trigger-variant",
    "close-button",
    "close-label",
  ];

  protected readonly initialFocus = ".search-dialog__input";
  #header!: DialogHeaderParts;
  #label!: HTMLLabelElement;
  #input!: HTMLInputElement;
  #status!: HTMLDivElement;
  #loading!: HTMLDivElement;
  #listbox!: HTMLDivElement;
  #empty!: HTMLParagraphElement;
  #instanceId = nextId("ds-search-dialog");

  #items: SearchDialogItem[] = [];
  #suggestions: SearchDialogItem[] = [];
  #query = "";
  #activeValue: string | null = null;
  #visible: SearchDialogItem[] = [];
  #renderedItems: SearchDialogItem[] | null = null;

  override connectedCallback() {
    upgradeProperty(this, "items");
    upgradeProperty(this, "suggestions");
    super.connectedCallback();
  }

  get items(): SearchDialogItem[] {
    return this.#items;
  }
  set items(items: SearchDialogItem[]) {
    this.#items = orderItems(items ?? []);
    this.#refresh();
  }

  get suggestions(): SearchDialogItem[] {
    return this.#suggestions;
  }
  set suggestions(items: SearchDialogItem[]) {
    this.#suggestions = orderItems(items ?? []);
    this.#refresh();
  }

  #filterVisible(): SearchDialogItem[] {
    return this.#query.trim() === "" && this.#suggestions.length
      ? this.#suggestions
      : defaultFilter(this.#items, this.#query);
  }

  /** Recompute the visible results and redraw the combobox parts. */
  #refresh() {
    this.#visible = this.#filterVisible();
    // A highlighted result the filter dropped can no longer be chosen.
    if (this.#activeValue && !this.#visible.some((item) => item.value === this.#activeValue)) {
      this.#activeValue = null;
    }
    if (this.panel) this.#applyCombobox();
  }

  protected override willOpen() {
    this.#query = "";
    this.#activeValue = null;
    this.#refresh();
  }

  #comboboxApi() {
    return combobox.connect({
      state: {
        open: this.open,
        value: null,
        inputValue: this.#query,
        // No selection persists, so there is no text to come back to; the
        // query survives blur through `settleOnBlur: false`.
        committedInputValue: "",
        activeValue: this.#activeValue,
        items: this.#visible,
        disabled: false,
        id: `${this.id || this.#instanceId}-search`,
      },
      setValue: (value) => {
        if (value != null) emit(this, "select", { value });
      },
      // The combobox closing (Escape, a choice) closes the dialog.
      setOpen: (next) => {
        if (!next) this.setOpen(false);
      },
      setActiveValue: (next) => {
        this.#activeValue = next;
        if (this.panel) this.#applyCombobox();
      },
      setInputValue: (next) => {
        this.#query = next;
        this.#refresh();
      },
      setCommittedInputValue: () => {},
      // The dialog owns dismissal: losing focus keeps the query and the list.
      settleOnBlur: false,
    });
  }

  protected render() {
    this.trigger = createButton();
    const panel = document.createElement("dialog");
    panel.className = "search-dialog__panel";

    this.#header = createDialogHeader({});

    const search = document.createElement("div");
    search.className = "search-dialog__search";
    const icon = document.createElement("span");
    icon.className = "search-dialog__search-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = searchIcon();
    this.#label = document.createElement("label");
    this.#label.className = "search-dialog__sr-only";
    this.#input = document.createElement("input");
    this.#input.className = "search-dialog__input";
    this.#input.type = "text";
    this.#input.addEventListener("input", () => {
      this.#query = this.#input.value;
      this.#visible = this.#filterVisible();
      // Typing highlights the first match, so Enter runs the top result.
      this.#activeValue = combobox.firstEnabled(this.#visible);
      this.#applyCombobox();
    });
    // The native text-selection `select` event bubbles; the host's `select`
    // means a chosen result, so the native one stops here.
    this.#input.addEventListener("select", (event) => event.stopPropagation());
    search.append(icon, this.#label, this.#input);

    this.#status = document.createElement("div");
    this.#status.className = "search-dialog__sr-only";
    this.#status.setAttribute("role", "status");

    // Decorative: the status region already says "Searching…".
    this.#loading = document.createElement("div");
    this.#loading.className = "search-dialog__loading";
    const indicator = document.createElement("span");
    indicator.className = "loading";
    indicator.dataset.variant = "dots";
    indicator.setAttribute("aria-hidden", "true");
    const dots = document.createElement("span");
    dots.className = "loading__indicator";
    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement("span");
      dot.className = "loading__dot";
      dots.append(dot);
    }
    indicator.append(dots);
    this.#loading.append(indicator);

    // Stays in the panel even when empty, so the input's aria-controls
    // always points at a real element.
    this.#listbox = document.createElement("div");
    this.#listbox.className = "search-dialog__list";

    this.#empty = document.createElement("p");
    this.#empty.className = "search-dialog__empty";

    panel.append(this.#header.header, search, this.#status, this.#listbox);
    this.textContent = "";
    this.append(this.trigger);
    this.panel = panel;
    this.#visible = this.#filterVisible();
  }

  protected sync() {
    const api = core.connect({
      state: { open: this.open, id: this.id || this.#instanceId, role: "dialog" },
      setOpen: this.setOpen,
    });

    syncDialogHeader(this.#header, {
      heading: localized(this, "heading", "searchDialog.title"),
      subtitle: null,
      hideTitle: boolAttr(this, "hide-title", true),
      closeButton: boolAttr(this, "close-button", false),
      closeLabel: localized(this, "close-label", "dialog.close"),
    });
    this.#label.textContent = localized(this, "label", "searchDialog.label");
    this.#input.placeholder = localized(this, "placeholder", "searchDialog.placeholder");
    this.trigger.textContent = localized(this, "trigger", "searchDialog.trigger");
    this.trigger.dataset.variant = this.getAttribute("trigger-variant") ?? "default";

    applyProps(this.trigger, api.triggerProps);
    applyProps(this.panel!, api.contentProps);
    applyProps(this.#header.heading, api.titleProps);
    applyProps(this.#header.close, api.closeProps);

    this.syncModal();
    this.#applyCombobox();
  }

  #option(item: SearchDialogItem): HTMLDivElement {
    const option = document.createElement("div");
    option.className = "search-dialog__item";
    const label = document.createElement("span");
    label.className = "search-dialog__item-label";
    label.textContent = labelOf(item);
    option.append(label);

    if (item.shortcut) {
      // Same markup as the Kbd component: a label, never a binding.
      const holder = document.createElement("span");
      holder.className = "search-dialog__item-shortcut";
      const kbd = document.createElement("kbd");
      if (Array.isArray(item.shortcut)) {
        kbd.className = "kbd kbd--chord";
        item.shortcut.forEach((key, index) => {
          if (index > 0) {
            const separator = document.createElement("span");
            separator.className = "kbd__sep";
            separator.setAttribute("aria-hidden", "true");
            separator.textContent = "+";
            kbd.append(separator);
          }
          const cap = document.createElement("kbd");
          cap.className = "kbd__key";
          cap.textContent = key;
          kbd.append(cap);
        });
      } else {
        kbd.className = "kbd kbd__key";
        kbd.textContent = item.shortcut;
      }
      holder.append(kbd);
      option.append(holder);
    }
    return option;
  }

  #rebuildList() {
    const listbox = this.#listbox;
    listbox.textContent = "";
    let group: HTMLDivElement | null = null;
    let groupName: string | null = null;
    for (const item of this.#visible) {
      const option = this.#option(item);
      if (!item.group) {
        // Ungrouped results sit directly in the listbox.
        listbox.append(option);
        continue;
      }
      if (item.group !== groupName) {
        groupName = item.group;
        group = document.createElement("div");
        group.className = "search-dialog__group";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", item.group);
        // The group's aria-label names it once; the visible header is hidden
        // from assistive tech.
        const header = document.createElement("span");
        header.className = "search-dialog__group-header";
        header.setAttribute("aria-hidden", "true");
        header.textContent = item.group;
        group.append(header);
        listbox.append(group);
      }
      group!.append(option);
    }
  }

  #applyCombobox() {
    if (!this.panel) return;
    const api = this.#comboboxApi();
    const loading = boolAttr(this, "loading");
    const emptyText = localized(this, "empty-text", "searchDialog.empty");
    const count = this.#visible.length;

    applyProps(this.#label, api.labelProps);
    applyProps(this.#input, api.inputProps);
    if (this.#input.value !== this.#query) this.#input.value = this.#query;
    applyProps(this.#listbox, api.listboxProps);

    if (this.#renderedItems !== this.#visible) {
      this.#renderedItems = this.#visible;
      this.#rebuildList();
    }
    const options = this.#listbox.querySelectorAll<HTMLElement>(".search-dialog__item");
    this.#visible.forEach((item, index) => {
      const option = options[index];
      if (option) applyProps(option, api.getOptionProps(item.value));
    });

    this.#status.textContent = loading
      ? t(this, "searchDialog.loading")
      : count === 0
        ? emptyText
        : t(this, "searchDialog.results", { count });

    // Added and removed, not hidden: the sheet gives these parts a display.
    if (loading) this.#listbox.before(this.#loading);
    else this.#loading.remove();
    this.#empty.textContent = emptyText;
    if (count === 0 && !loading) this.#listbox.after(this.#empty);
    else this.#empty.remove();

    if (this.open) {
      requestAnimationFrame(() => {
        this.#listbox
          .querySelector<HTMLElement>("[data-active]")
          ?.scrollIntoView?.({ block: "nearest" });
      });
    }
  }
}
