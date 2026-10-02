import { boolAttr, emit, HTMLElementBase } from "../internal/base";
import { feedbackIcon, type FeedbackStatus } from "../internal/icons";

type ErrorStateRegion = "icon" | "actions";

/**
 * `<ds-error-state>` presents a failure that replaces page or section content.
 * Unslotted light-DOM children add supporting content. Children marked
 * `slot="icon"` or `slot="actions"` replace those regions.
 *
 * Attributes: `title` (required), `description`, `status`, `heading-level`,
 * `size`, `action-label`, `live`.
 * `live` makes the state an assertive `role="alert"`, for a failure that
 * appears after the page loaded; without it the state has no live role.
 * The content is built once and updated in place, so an attribute change
 * never rebuilds, and never announces again, what did not change.
 * Events: `action` when the generated recovery button is pressed.
 */
export class DsErrorState extends HTMLElementBase {
  static observedAttributes = [
    "title",
    "description",
    "status",
    "heading-level",
    "size",
    "action-label",
    "live",
  ];

  #regions = new Map<ErrorStateRegion | "default", Node[]>();
  #captured = false;
  #root: HTMLDivElement | null = null;
  #icon: HTMLSpanElement | null = null;
  #heading: HTMLHeadingElement | null = null;
  #description: HTMLParagraphElement | null = null;
  #actions: HTMLDivElement | null = null;
  #button: HTMLButtonElement | null = null;

  connectedCallback() {
    if (!this.#captured) this.#capture();
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#captured && this.isConnected) this.#render();
  }

  #capture() {
    for (const node of Array.from(this.childNodes)) {
      const slot = node instanceof Element ? node.getAttribute("slot") : null;
      const region = slot === "icon" || slot === "actions" ? slot : "default";
      if (region === "default" && node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
        node.remove();
        continue;
      }
      if (node instanceof Element && region !== "default") node.removeAttribute("slot");
      const nodes = this.#regions.get(region) ?? [];
      nodes.push(node);
      this.#regions.set(region, nodes);
    }
    this.#captured = true;
  }

  #render() {
    const root = this.#root ?? this.#build();
    if (root.parentNode !== this) this.appendChild(root);

    if (boolAttr(this, "live")) root.setAttribute("role", "alert");
    else root.removeAttribute("role");
    setData(root, "size", this.getAttribute("size") === "sm" ? "sm" : "md");

    if (this.#icon) {
      const status = this.#status();
      if (this.#icon.dataset.status !== status) {
        this.#icon.dataset.status = status;
        this.#icon.innerHTML = feedbackIcon(status);
      }
    }

    const tag = `H${this.#headingLevel()}`;
    let heading = this.#heading!;
    if (heading.tagName !== tag) {
      const next = document.createElement(tag.toLowerCase()) as HTMLHeadingElement;
      next.className = heading.className;
      next.textContent = heading.textContent;
      heading.replaceWith(next);
      heading = this.#heading = next;
    }
    setText(heading, this.getAttribute("title") ?? "");

    const description = this.getAttribute("description");
    const text = this.#description!;
    if (description) {
      setText(text, description);
      if (text.parentNode !== root) heading.after(text);
    } else text.remove();

    const actionLabel = this.getAttribute("action-label");
    if (this.#actions) {
      if (actionLabel) {
        setText(this.#button!, actionLabel);
        if (this.#actions.parentNode !== root) root.appendChild(this.#actions);
      } else this.#actions.remove();
    }
  }

  /** Build the parts once; later renders update them in place. */
  #build() {
    const root = document.createElement("div");
    root.className = "error-state";

    const iconRegion = document.createElement("span");
    iconRegion.className = "error-state__icon";
    const iconRegionNodes = this.#regions.get("icon");
    if (iconRegionNodes?.length) iconRegion.append(...iconRegionNodes);
    else {
      const icon = document.createElement("span");
      icon.className = "feedback-icon";
      icon.dataset.box = "tint";
      icon.dataset.shape = "round";
      icon.setAttribute("aria-hidden", "true");
      iconRegion.appendChild(icon);
      this.#icon = icon;
    }
    root.appendChild(iconRegion);

    const heading = document.createElement(`h${this.#headingLevel()}`) as HTMLHeadingElement;
    heading.className = "error-state__title";
    root.appendChild(heading);
    this.#heading = heading;

    const text = document.createElement("p");
    text.className = "error-state__description";
    this.#description = text;

    const content = this.#regions.get("default");
    if (content?.length) root.append(...content);

    const customActions = this.#region("actions", "error-state__actions");
    if (customActions) root.appendChild(customActions);
    else {
      const actions = document.createElement("div");
      actions.className = "error-state__actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button";
      button.dataset.variant = "default";
      button.addEventListener("click", () => emit(this, "action"));
      actions.appendChild(button);
      this.#actions = actions;
      this.#button = button;
    }

    this.#root = root;
    return root;
  }

  #region(region: ErrorStateRegion, className: string) {
    const nodes = this.#regions.get(region);
    if (!nodes?.length) return null;
    const element = document.createElement("div");
    element.className = className;
    element.append(...nodes);
    return element;
  }

  #status(): FeedbackStatus {
    const status = this.getAttribute("status");
    return status === "info" || status === "success" || status === "warning" || status === "neutral"
      ? status
      : "danger";
  }

  #headingLevel() {
    const value = Number(this.getAttribute("heading-level") ?? 2);
    return Number.isInteger(value) && value >= 1 && value <= 6 ? value : 2;
  }
}

const setText = (element: HTMLElement, text: string) => {
  if (element.textContent !== text) element.textContent = text;
};

const setData = (element: HTMLElement, key: string, value: string) => {
  if (element.dataset[key] !== value) element.dataset[key] = value;
};
