import { HTMLElementBase, nextId } from "../internal/base";

type CardRegion = "media" | "icon" | "title" | "description" | "tags" | "actions" | "metric";

/**
 * `<ds-card>` renders a media card or dashboard metric as a native article.
 * Unslotted children fill the body. Light-DOM children may declare `slot` as
 * `media`, `icon`, `title`, `description`, `tags`, `actions`, or `metric`.
 *
 * Attributes: `variant` (`media` or `dashboard`), `orientation` (`vertical` or
 * `horizontal`), `surface` (`default` or `secondary`), `image-src`, `image-alt`, `title`, `heading-level`,
 * `description`, `value`, `change`, `trend` (`up`, `down`, or `neutral`).
 */
export class DsCard extends HTMLElementBase {
  static observedAttributes = [
    "variant",
    "orientation",
    "surface",
    "image-src",
    "image-alt",
    "title",
    "heading-level",
    "description",
    "value",
    "change",
    "trend",
  ];

  #regions = new Map<CardRegion | "default", Node[]>();
  #captured = false;
  #titleId = nextId("ds-card");

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
      const region = this.#isRegion(slot) ? slot : "default";
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
    const article = document.createElement("article");
    article.className =
      this.#variant() === "dashboard" ? "card card--dashboard" : "card card--media";
    article.dataset.surface =
      this.getAttribute("surface") === "secondary" ? "secondary" : "default";

    const title = this.#heading();
    if (title?.id) article.setAttribute("aria-labelledby", title.id);

    if (this.#variant() === "dashboard") {
      const head = document.createElement("div");
      head.className = "card__dash-head";
      const icon = this.#region("icon", "span", "card__icon");
      if (icon) {
        icon.setAttribute("aria-hidden", "true");
        head.appendChild(icon);
      }
      if (title) head.appendChild(title);

      const metric = document.createElement("div");
      metric.className = "card__metric";
      const value = this.getAttribute("value");
      if (value != null) metric.appendChild(this.#text("span", "card__value", value));
      const change = this.getAttribute("change");
      if (change != null) {
        const changeNode = this.#text("span", "card__change", change);
        changeNode.dataset.trend = this.#trend();
        metric.appendChild(changeNode);
      }
      const metricRegion = this.#region("metric", "span", "card__metric-content");
      if (metricRegion) metric.appendChild(metricRegion);
      article.append(head, metric);
    } else {
      article.dataset.orientation =
        this.getAttribute("orientation") === "horizontal" ? "horizontal" : "vertical";
      const media = this.#media();
      if (media) article.appendChild(media);

      const body = document.createElement("div");
      body.className = "card__body";
      const head = document.createElement("div");
      head.className = "card__head";
      if (title) head.appendChild(title);
      const tags = this.#region("tags", "div", "card__tags");
      if (tags) head.appendChild(tags);
      body.appendChild(head);

      const descriptionNodes = this.#regions.get("description");
      const description = this.getAttribute("description");
      if (descriptionNodes?.length || description != null) {
        const node = document.createElement("div");
        node.className = "card__description";
        if (descriptionNodes?.length) node.append(...descriptionNodes);
        else node.textContent = description;
        body.appendChild(node);
      }
      const content = this.#region("default", "div", "card__content");
      if (content) body.appendChild(content);
      article.appendChild(body);

      const actions = this.#region("actions", "div", "card__actions");
      if (actions) article.appendChild(actions);
    }

    this.appendChild(article);
  }

  #heading(): HTMLElement | null {
    const titleNodes = this.#regions.get("title");
    const titleText = this.getAttribute("title");
    if (!titleNodes?.length && titleText == null) return null;
    const heading = document.createElement(`h${this.#headingLevel()}`);
    heading.className = "card__title";
    heading.id = this.#titleId;
    if (titleNodes?.length) heading.append(...titleNodes);
    else heading.textContent = titleText;
    return heading;
  }

  #media(): HTMLElement | null {
    const media = this.#region("media", "div", "card__media");
    if (media) return media;
    const icon = this.#region("icon", "span", "card__media card__media--icon");
    if (icon) {
      icon.setAttribute("aria-hidden", "true");
      return icon;
    }
    const src = this.getAttribute("image-src");
    if (!src) return null;
    const wrapper = document.createElement("div");
    wrapper.className = "card__media";
    const image = document.createElement("img");
    image.className = "card__image";
    image.src = src;
    image.alt = this.getAttribute("image-alt") ?? "";
    wrapper.appendChild(image);
    return wrapper;
  }

  #region(region: CardRegion | "default", tag: string, className: string): HTMLElement | null {
    const nodes = this.#regions.get(region);
    if (!nodes?.length) return null;
    const element = document.createElement(tag);
    element.className = className;
    element.append(...nodes);
    return element;
  }

  #text(tag: string, className: string, text: string) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  #variant() {
    return this.getAttribute("variant") === "dashboard" ? "dashboard" : "media";
  }

  #trend() {
    const trend = this.getAttribute("trend");
    return trend === "up" || trend === "down" ? trend : "neutral";
  }

  #headingLevel() {
    const value = Number(this.getAttribute("heading-level") ?? 3);
    return Number.isInteger(value) && value >= 2 && value <= 6 ? value : 3;
  }

  #isRegion(value: string | null): value is CardRegion {
    return (
      value === "media" ||
      value === "icon" ||
      value === "title" ||
      value === "description" ||
      value === "tags" ||
      value === "actions" ||
      value === "metric"
    );
  }
}
