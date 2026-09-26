import { boolAttr, emit, HTMLElementBase, nextId, upgradeProperty } from "../internal/base";
import { closeIcon, feedbackIcon, type FeedbackStatus } from "../internal/icons";
import { localized, onLocaleChange } from "../internal/i18n";

type NotificationRegion = "icon" | "link" | "actions";

/**
 * `<ds-inline-notification>` presents feedback in the page flow. Unslotted
 * children replace the plain-text body; `slot="icon"`, `slot="link"`, and
 * `slot="actions"` replace those regions.
 *
 * Attributes: `title` (required), `description`, `status`, `href`, `link-text`,
 * `closable`, `close-label`, `open`, `role`, `inverted`, `plain`, `icon-shape`,
 * `icon-box`, `snack`.
 * Properties: `open` (boolean).
 * Events: `close` and `open-change` after the close button is activated.
 */
export class DsInlineNotification extends HTMLElementBase {
  static observedAttributes = [
    "title",
    "description",
    "status",
    "href",
    "link-text",
    "closable",
    "close-label",
    "open",
    "role",
    "inverted",
    "plain",
    "icon-shape",
    "icon-box",
    "snack",
  ];

  #regions = new Map<NotificationRegion | "default", Node[]>();
  #captured = false;
  #titleId = `${nextId("ds-alert")}-title`;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#captured && this.isConnected) this.#render();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "open");
    if (!this.#captured) this.#capture();
    this.#render();
  }

  attributeChangedCallback() {
    if (this.#captured && this.isConnected) this.#render();
  }

  get open(): boolean {
    return boolAttr(this, "open", true);
  }
  set open(value: boolean) {
    this.setAttribute("open", String(value));
  }

  #capture() {
    for (const node of Array.from(this.childNodes)) {
      const slot = node instanceof Element ? node.getAttribute("slot") : null;
      const region = slot === "icon" || slot === "link" || slot === "actions" ? slot : "default";
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
    const role = this.#role();
    if (this.getAttribute("role") !== role) {
      this.setAttribute("role", role);
      return;
    }
    this.textContent = "";
    if (!this.open) {
      this.removeAttribute("aria-labelledby");
      return;
    }

    const root = document.createElement("div");
    root.className = "inline-notification";
    root.dataset.status = this.#status();
    if (boolAttr(this, "inverted")) root.dataset.inverted = "";
    if (boolAttr(this, "plain")) root.dataset.plain = "";
    if (boolAttr(this, "snack")) root.dataset.snack = "";

    const icon = document.createElement("span");
    icon.className = "feedback-icon";
    icon.dataset.status = this.#status();
    icon.dataset.shape = this.getAttribute("icon-shape") === "round" ? "round" : "rounded";
    icon.dataset.box = this.#iconBox();
    icon.setAttribute("aria-hidden", "true");
    const iconNodes = this.#regions.get("icon");
    if (iconNodes?.length) icon.append(...iconNodes);
    else icon.innerHTML = feedbackIcon(this.#status());
    root.appendChild(icon);

    const content = document.createElement("div");
    content.className = "inline-notification__content";
    const title = this.getAttribute("title") ?? "";
    if (title) {
      const heading = document.createElement("p");
      heading.className = "inline-notification__title";
      heading.id = this.#titleId;
      heading.textContent = title;
      content.appendChild(heading);
      this.setAttribute("aria-labelledby", this.#titleId);
    } else this.removeAttribute("aria-labelledby");

    if (!boolAttr(this, "snack")) {
      const bodyNodes = this.#regions.get("default");
      const description = this.getAttribute("description");
      if (bodyNodes?.length || description) {
        const body = document.createElement("div");
        body.className = "inline-notification__body";
        if (bodyNodes?.length) body.append(...bodyNodes);
        else body.textContent = description;
        content.appendChild(body);
      }
    }

    const customLink = this.#regions.get("link");
    const href = this.getAttribute("href");
    if (customLink?.length) content.append(...customLink);
    else if (href) {
      const link = document.createElement("a");
      link.className = "inline-notification__link";
      link.href = href;
      link.textContent = localized(this, "link-text", "inlineNotification.learnMore");
      content.appendChild(link);
    }

    const actions = this.#region("actions", "inline-notification__actions");
    if (actions) content.appendChild(actions);
    root.appendChild(content);

    if (boolAttr(this, "closable")) {
      const closeRegion = document.createElement("span");
      closeRegion.className = "inline-notification__close";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "button button--icon-only";
      close.dataset.variant = "ghost";
      close.setAttribute("aria-label", localized(this, "close-label", "inlineNotification.close"));
      close.innerHTML = closeIcon();
      close.addEventListener("click", () => {
        this.open = false;
        emit(this, "close");
        emit(this, "open-change", { open: false });
      });
      closeRegion.appendChild(close);
      root.appendChild(closeRegion);
    }

    this.appendChild(root);
  }

  #region(region: NotificationRegion, className: string) {
    const nodes = this.#regions.get(region);
    if (!nodes?.length) return null;
    const element = document.createElement("div");
    element.className = className;
    element.append(...nodes);
    return element;
  }

  #role(): "status" | "alert" | "region" {
    const role = this.getAttribute("role");
    return role === "alert" || role === "region" ? role : "status";
  }

  #status(): FeedbackStatus {
    const status = this.getAttribute("status");
    return status === "success" ||
      status === "warning" ||
      status === "danger" ||
      status === "neutral"
      ? status
      : "info";
  }

  #iconBox(): "tint" | "transparent" | "solid" {
    const box = this.getAttribute("icon-box");
    if (box === "tint" || box === "solid" || box === "transparent") return box;
    return boolAttr(this, "snack")
      ? "transparent"
      : boolAttr(this, "plain") || boolAttr(this, "inverted")
        ? "tint"
        : "transparent";
  }
}
