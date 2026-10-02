import { HTMLElementBase, upgradeProperty } from "../internal/base";
import { onLocaleChange, t } from "../internal/i18n";

/** One person in the group. */
export interface AvatarGroupItem {
  /** Accessible name and initials fallback. */
  name: string;
  /** Image URL; falls back to initials when absent or it fails to load. */
  src?: string;
  /** Accessible name override; defaults to `name`. */
  alt?: string;
  /** Background tint for the initials avatar (any CSS color). */
  color?: string;
}

/**
 * `<ds-avatar-group>` — a row of overlapping avatars (a team, attendees,
 * collaborators), ported from the Svelte adapter with identical classes. It
 * shows up to `max` avatars and collapses the rest into a "+N" chip.
 *
 * The row is a labelled group (`role="group"`), each `<ds-avatar>` keeps its
 * own accessible name, and the chip reads as "N more". Register `<ds-avatar>`
 * too (the `define` entry does both).
 *
 * Attributes: `label` (required: the group's accessible name), `max` (the
 * avatars shown before the "+N" chip; 4 by default), `size` (sm|md|lg),
 * `shape` (circle|square).
 * Properties: `items`.
 */
export class DsAvatarGroup extends HTMLElementBase {
  static observedAttributes = ["label", "max", "size", "shape"];

  #items: AvatarGroupItem[] = [];
  #root: HTMLDivElement | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#root) this.#render();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "items");
    if (!this.#root) {
      this.#root = document.createElement("div");
      this.#root.className = "avatar-group";
      this.#root.setAttribute("role", "group");
      this.appendChild(this.#root);
    }
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#root) this.#render();
  }

  get items(): AvatarGroupItem[] {
    return this.#items;
  }
  set items(value: AvatarGroupItem[]) {
    this.#items = Array.isArray(value) ? value : [];
    if (this.#root) this.#render();
  }

  #max() {
    const raw = this.getAttribute("max");
    const value = raw == null || raw.trim() === "" ? NaN : Number(raw);
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 4;
  }

  #render() {
    const root = this.#root!;
    const sizeAttr = this.getAttribute("size");
    const size = sizeAttr === "sm" || sizeAttr === "lg" ? sizeAttr : "md";
    const shape = this.getAttribute("shape") === "square" ? "square" : "circle";
    root.dataset.size = size;
    root.dataset.shape = shape;
    root.setAttribute("aria-label", this.getAttribute("label") ?? "");

    const visible = this.#items.slice(0, this.#max());
    const overflow = this.#items.length - visible.length;

    const nodes: HTMLElement[] = visible.map((item) => {
      const wrapper = document.createElement("span");
      wrapper.className = "avatar-group__item";
      // A custom property, so the value stays a color and never reaches markup.
      if (item.color) wrapper.style.setProperty("--ds-avatar-bg", item.color);
      const avatar = document.createElement("ds-avatar");
      avatar.setAttribute("name", item.name);
      if (item.src) avatar.setAttribute("src", item.src);
      if (item.alt) avatar.setAttribute("alt", item.alt);
      avatar.setAttribute("size", size);
      avatar.setAttribute("shape", shape);
      wrapper.appendChild(avatar);
      return wrapper;
    });

    if (overflow > 0) {
      const chip = document.createElement("span");
      chip.className = "avatar-group__item avatar-group__overflow";
      chip.dataset.size = size;
      chip.dataset.shape = shape;
      chip.setAttribute("role", "img");
      chip.setAttribute("aria-label", t(this, "avatarGroup.more", { count: overflow }));
      const text = document.createElement("span");
      text.setAttribute("aria-hidden", "true");
      text.textContent = `+${overflow}`;
      chip.appendChild(text);
      nodes.push(chip);
    }

    root.replaceChildren(...nodes);
  }
}
