import { emit, HTMLElementBase } from "../internal/base";
import { feedbackIcon, type FeedbackStatus } from "../internal/icons";

type EmptyStateRegion = "illustration" | "actions";

/**
 * `<ds-empty-state>` presents a successful but empty collection or section.
 * Unslotted light-DOM children add supporting content. Children marked
 * `slot="illustration"` or `slot="actions"` replace those regions.
 *
 * Attributes: `title` (required), `description`, `status`, `heading-level`,
 * `size`, `action-label`.
 * Events: `action` when the generated action button is pressed.
 */
export class DsEmptyState extends HTMLElementBase {
  static observedAttributes = [
    "title",
    "description",
    "status",
    "heading-level",
    "size",
    "action-label",
  ];

  #regions = new Map<EmptyStateRegion | "default", Node[]>();
  #captured = false;

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
      const region = slot === "illustration" || slot === "actions" ? slot : "default";
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
    this.textContent = "";
    const root = document.createElement("div");
    root.className = "empty-state";
    root.setAttribute("role", "status");
    root.dataset.size = this.getAttribute("size") === "sm" ? "sm" : "md";

    const illustration = document.createElement("span");
    illustration.className = "empty-state__illustration";
    const illustrationNodes = this.#regions.get("illustration");
    if (illustrationNodes?.length) illustration.append(...illustrationNodes);
    else {
      const icon = document.createElement("span");
      icon.className = "feedback-icon";
      icon.dataset.status = this.#status();
      icon.dataset.box = "tint";
      icon.dataset.shape = "round";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = feedbackIcon(this.#status());
      illustration.appendChild(icon);
    }
    root.appendChild(illustration);

    const heading = document.createElement(`h${this.#headingLevel()}`);
    heading.className = "empty-state__title";
    heading.textContent = this.getAttribute("title") ?? "";
    root.appendChild(heading);

    const description = this.getAttribute("description");
    if (description) {
      const text = document.createElement("p");
      text.className = "empty-state__description";
      text.textContent = description;
      root.appendChild(text);
    }

    const content = this.#regions.get("default");
    if (content?.length) root.append(...content);

    const customActions = this.#region("actions", "empty-state__actions");
    const actionLabel = this.getAttribute("action-label");
    if (customActions) root.appendChild(customActions);
    else if (actionLabel) {
      const actions = document.createElement("div");
      actions.className = "empty-state__actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button";
      button.dataset.variant = "default";
      button.textContent = actionLabel;
      button.addEventListener("click", () => emit(this, "action"));
      actions.appendChild(button);
      root.appendChild(actions);
    }

    this.appendChild(root);
  }

  #region(region: EmptyStateRegion | "default", className: string) {
    const nodes = this.#regions.get(region);
    if (!nodes?.length) return null;
    const element = document.createElement("div");
    element.className = className;
    element.append(...nodes);
    return element;
  }

  #status(): FeedbackStatus {
    const status = this.getAttribute("status");
    return status === "info" || status === "success" || status === "warning" || status === "danger"
      ? status
      : "neutral";
  }

  #headingLevel() {
    const value = Number(this.getAttribute("heading-level") ?? 2);
    return Number.isInteger(value) && value >= 1 && value <= 6 ? value : 2;
  }
}
