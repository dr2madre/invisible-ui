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
  /** Ends the core's management of the group while it is out of the page. */
  #teardown: (() => void) | null = null;

  connectedCallback() {
    if (!this.#group) this.#render();
    this.#sync();
    this.#teardown ??= core.manage(this.#group!, { orientation: () => this.#orientation() });
  }

  disconnectedCallback() {
    this.#teardown?.();
    this.#teardown = null;
  }

  attributeChangedCallback() {
    if (this.#group) this.#sync();
  }

  #render() {
    const group = document.createElement("div");
    group.setAttribute("role", "group");
    while (this.firstChild) group.appendChild(this.firstChild);
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
}
