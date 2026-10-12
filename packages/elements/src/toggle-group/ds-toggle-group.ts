import { toggleGroup as core } from "@design-system/core";
import { boolAttr, HTMLElementBase } from "../internal/base";

export type ToggleGroupVariant = "separate" | "segmented";
export type ToggleGroupOrientation = "horizontal" | "vertical";

/**
 * `<ds-toggle-group>` — arranges independent `<ds-toggle-button>` children,
 * gives them a shared look and, with three or more, one tab stop.
 *
 * It holds no selection state: each toggle inside is a native button with
 * `aria-pressed` that owns its pressed state, name and form field. The
 * children move into a `role="group"` container on first connection.
 *
 * Keyboard (the core's toggle group rule): with three or more toggles the
 * group is one tab stop, the arrow keys move focus between the enabled
 * toggles and wrap (Left and Right follow the reading direction when
 * horizontal, Up and Down when vertical), Home and End jump to the ends.
 * With one or two toggles each is its own tab stop and the group adds no
 * keys. Inside a `[role="toolbar"]` the toolbar's keys apply and the group
 * adds nothing. Moving focus never changes a toggle. Toggles added, removed
 * or disabled later are followed, and removing the focused toggle moves
 * focus to the one now at its place.
 *
 * ```html
 * <ds-toggle-group label="Formatting" variant="segmented">
 *   <ds-toggle-button label="Bold">B</ds-toggle-button>
 *   <ds-toggle-button label="Italic">I</ds-toggle-button>
 * </ds-toggle-group>
 * ```
 *
 * `label` names the container for screen readers ("group, Formatting"), not
 * the items; leave it out when the toggles are unrelated.
 *
 * Attributes: `variant` (separate|segmented), `orientation`
 * (horizontal|vertical), `wrap`, `label`.
 */
export class DsToggleGroup extends HTMLElementBase {
  static observedAttributes = ["variant", "orientation", "wrap", "label"];

  #group: HTMLDivElement | null = null;
  #observer: MutationObserver | null = null;
  /** The toggle focused last, and its index then, for the tab stop and refocus. */
  #last: HTMLButtonElement | null = null;
  #lastIndex = -1;
  /** Whether focus is in the group, still true after the focused toggle is removed. */
  #hasFocus = false;
  /** Toggles whose tabindex the group set, so it can take it back. */
  #managed = new Set<HTMLButtonElement>();

  connectedCallback() {
    if (!this.#group) this.#render();
    this.#sync();
    this.#reconcile();
    this.#observer ??= new MutationObserver(() => this.#reconcile());
    this.#observer.observe(this.#group!, {
      childList: true,
      subtree: true,
      attributeFilter: ["disabled"],
    });
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  attributeChangedCallback() {
    if (this.#group) this.#sync();
  }

  #render() {
    const group = document.createElement("div");
    group.setAttribute("role", "group");
    while (this.firstChild) group.appendChild(this.firstChild);
    group.addEventListener("keydown", (event) => this.#onKeydown(event));
    group.addEventListener("focusin", (event) => {
      const toggles = this.#toggles();
      const index = toggles.indexOf(event.target as HTMLButtonElement);
      if (index === -1) return;
      this.#last = toggles[index]!;
      this.#lastIndex = index;
      this.#hasFocus = true;
      this.#reconcile();
    });
    group.addEventListener("focusout", (event) => {
      const target = event.target as HTMLElement;
      // Decided a task later: a toggle removed while focused is disconnected
      // by then, and the group still owes it a place to put focus.
      setTimeout(() => {
        if (target.isConnected && !group.contains(document.activeElement)) this.#hasFocus = false;
      });
    });
    this.appendChild(group);
    this.#group = group;
  }

  #sync() {
    const group = this.#group!;
    const variant: ToggleGroupVariant =
      this.getAttribute("variant") === "segmented" ? "segmented" : "separate";

    group.className = `toggle-group toggle-group--${variant}`;
    // Wrapping only applies to separate toggles: a segmented group is one control.
    group.classList.toggle("toggle-group--wrap", boolAttr(this, "wrap") && variant === "separate");
    group.dataset.orientation = this.#orientation();
    const label = this.getAttribute("label");
    if (label == null) group.removeAttribute("aria-label");
    else group.setAttribute("aria-label", label);
  }

  #orientation(): ToggleGroupOrientation {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  /** The toggles of this group, not of a group nested in it, in DOM order. */
  #toggles(): HTMLButtonElement[] {
    const group = this.#group;
    if (!group) return [];
    return Array.from(group.querySelectorAll<HTMLButtonElement>("button.toggle")).filter(
      (el) => el.closest(".toggle-group") === group,
    );
  }

  #inToolbar(): boolean {
    return this.#group?.closest('[role="toolbar"]') != null;
  }

  #roves(toggles: HTMLButtonElement[]): boolean {
    return core.roves({ count: toggles.length, inToolbar: this.#inToolbar() });
  }

  #reconcile() {
    const toggles = this.#toggles();
    this.#refocus(toggles);
    // Inside a toolbar the toolbar owns every tabindex.
    if (this.#inToolbar()) {
      this.#managed.clear();
      return;
    }
    if (!this.#roves(toggles)) {
      for (const el of this.#managed) el.removeAttribute("tabindex");
      this.#managed.clear();
      return;
    }
    const stop = core.tabStop({
      disabled: toggles.map((el) => el.disabled),
      focused: toggles.indexOf(document.activeElement as HTMLButtonElement),
      last: this.#last ? toggles.indexOf(this.#last) : -1,
    });
    for (const el of this.#managed) if (!toggles.includes(el)) this.#managed.delete(el);
    toggles.forEach((el, index) => {
      el.tabIndex = index === stop ? 0 : -1;
      this.#managed.add(el);
    });
  }

  /** Focus never falls out of the group when the focused toggle is removed. */
  #refocus(toggles: HTMLButtonElement[]) {
    const last = this.#last;
    if (!last) return;
    if (toggles.includes(last)) {
      this.#lastIndex = toggles.indexOf(last);
      return;
    }
    const active = document.activeElement;
    // A removed toggle that had focus leaves it on the body.
    const lost = this.#hasFocus && (active === null || active === document.body);
    this.#last = null;
    if (!lost) {
      this.#hasFocus = false;
      return;
    }
    const index = core.refocusIndex({ lastIndex: this.#lastIndex, count: toggles.length });
    const target = index === -1 ? null : toggles[index]!;
    if (!target) return;
    this.#last = target;
    this.#lastIndex = index;
    target.focus();
  }

  #onKeydown(event: KeyboardEvent) {
    const toggles = this.#toggles();
    if (!this.#roves(toggles)) return;
    const index = toggles.indexOf(event.target as HTMLButtonElement);
    if (index === -1) return;
    const next = core.move({
      key: event.key,
      index,
      disabled: toggles.map((el) => el.disabled),
      orientation: this.#orientation(),
      direction: getComputedStyle(this.#group!).direction === "rtl" ? "rtl" : "ltr",
    });
    if (next === null) return;
    event.preventDefault();
    toggles[next]!.focus();
  }
}
