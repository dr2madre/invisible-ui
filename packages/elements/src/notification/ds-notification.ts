import { boolAttr, HTMLElementBase, nextId, upgradeProperty } from "../internal/base";
import { closeIcon, feedbackIcon, type FeedbackStatus } from "../internal/icons";
import { onLocaleChange, t } from "../internal/i18n";

export type NotificationStatus = FeedbackStatus;

/**
 * Why a notification closed: `user` (close button or swipe), `timeout` (the
 * auto-dismiss countdown), `action` (an action that dismisses) or `api`
 * (`dismiss()` or `clear()` on the region).
 */
export type NotificationDismissReason = "user" | "timeout" | "action" | "api";

/** An action button shown inside a notification. */
export interface NotificationAction {
  label: string;
  variant?: "default" | "primary" | "secondary" | "ghost" | "danger";
  /** Run when the action is clicked. */
  onClick?: () => void;
  /** Keep the notification open after the action runs. */
  keepOpen?: boolean;
}

/**
 * The element whose locale scope a notification reads. A region moves its
 * notifications to `<body>`, out of the provider around it, so it names itself.
 */
export const localeAnchors = new WeakMap<Element, Element>();

const STATUSES = ["info", "success", "warning", "danger", "neutral"];

const numberAttr = (element: Element, name: string) => {
  const value = Number(element.getAttribute(name));
  return Number.isFinite(value) && value > 0 ? value : 0;
};

/**
 * `<ds-notification>` — a floating message (toast or snack), ported from the
 * Svelte adapter. It reuses the Inline Notification anatomy and, like
 * `<ds-inline-notification>`, the element itself is the live region
 * (`role="status"`, or `role="alert"` for urgent messages), named by its title. Usually a `<ds-notification-region>`
 * creates and stacks it; it also works on its own.
 *
 * It stays until closed. Auto-dismiss is opt-in through `duration` (ms) and
 * the countdown holds while `paused` is set; the region sets it while the stack
 * is hovered or holds focus (WCAG 2.2.1). A new `duration` restarts the
 * countdown. Title and text are always text, never markup.
 *
 * Attributes: `title`, `text`, `status`, `duration` (ms, `0` keeps it until
 * closed), `closable` (on by default, `"false"` removes the close button),
 * `close-label`, `role`, `inverted`, `snack`, `icon-shape`, `icon-box`,
 * `paused`.
 * Properties: `actions` (action buttons that dismiss after they run unless
 * `keepOpen`), `duration`, `paused`.
 * Emits: `close` (`detail.reason`: `user`, `timeout` or `action`; cancelable,
 * and the element removes itself unless the event is canceled).
 */
export class DsNotification extends HTMLElementBase {
  static observedAttributes = [
    "title",
    "text",
    "status",
    "duration",
    "closable",
    "close-label",
    "role",
    "inverted",
    "snack",
    "icon-shape",
    "icon-box",
    "paused",
  ];

  #actions: NotificationAction[] = [];
  #titleId = `${nextId("ds-notification")}-title`;
  #rendered = false;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #remaining = 0;
  #startedAt = 0;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (this.#rendered) this.#render();
    });
  }

  connectedCallback() {
    for (const property of ["actions", "duration", "paused"]) upgradeProperty(this, property);
    if (!this.#rendered) {
      this.#remaining = this.duration;
      this.#render();
    }
    if (!this.paused) this.#start();
  }

  disconnectedCallback() {
    // Moving the element keeps the time left; removing it stops the countdown.
    this.#pause();
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null) {
    if (!this.#rendered || previous === next) return;
    if (name === "paused") {
      if (this.paused) this.#pause();
      else if (this.isConnected) this.#start();
      return;
    }
    if (name === "duration") {
      this.#clearTimer();
      this.#remaining = this.duration;
      if (!this.paused && this.isConnected) this.#start();
      return;
    }
    this.#render();
  }

  get actions(): NotificationAction[] {
    return this.#actions;
  }
  set actions(value: NotificationAction[]) {
    this.#actions = Array.isArray(value) ? value : [];
    if (this.#rendered) this.#render();
  }

  get duration(): number {
    return numberAttr(this, "duration");
  }
  set duration(value: number) {
    this.setAttribute("duration", String(value));
  }

  get paused(): boolean {
    return boolAttr(this, "paused");
  }
  set paused(value: boolean) {
    if (value) this.setAttribute("paused", "");
    else this.removeAttribute("paused");
  }

  #clearTimer() {
    if (this.#timer === undefined) return;
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  #start() {
    if (this.duration <= 0 || this.#remaining <= 0 || this.#timer !== undefined) return;
    this.#startedAt = Date.now();
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      this.#close("timeout");
    }, this.#remaining);
  }

  #pause() {
    if (this.#timer === undefined) return;
    this.#clearTimer();
    this.#remaining -= Date.now() - this.#startedAt;
  }

  #close(reason: Exclude<NotificationDismissReason, "api">) {
    const event = new CustomEvent("close", {
      detail: { reason },
      bubbles: true,
      cancelable: true,
    });
    if (this.dispatchEvent(event)) this.remove();
  }

  #status(): NotificationStatus {
    const status = this.getAttribute("status") ?? "";
    return (STATUSES.includes(status) ? status : "info") as NotificationStatus;
  }

  #render() {
    const role = this.getAttribute("role") === "alert" ? "alert" : "status";
    // Normalizing the attribute calls back into this render.
    if (this.getAttribute("role") !== role) {
      this.setAttribute("role", role);
      if (this.#rendered) return;
    }
    // A re-render replaces the buttons; the one holding focus gets it back.
    const focused = this.contains(document.activeElement)
      ? Array.from(this.querySelectorAll("button")).indexOf(
          document.activeElement as HTMLButtonElement,
        )
      : -1;

    const status = this.#status();
    const snack = boolAttr(this, "snack");
    const inverted = boolAttr(this, "inverted");

    const root = document.createElement("div");
    root.className = "inline-notification";
    root.dataset.status = status;
    if (inverted) root.dataset.inverted = "";
    if (snack) root.dataset.snack = "";

    const icon = document.createElement("span");
    icon.className = "feedback-icon";
    icon.dataset.status = status;
    icon.dataset.shape = this.getAttribute("icon-shape") === "round" ? "round" : "rounded";
    const box = this.getAttribute("icon-box");
    icon.dataset.box =
      box === "tint" || box === "solid" || box === "transparent"
        ? box
        : !snack && inverted
          ? "tint"
          : "transparent";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = feedbackIcon(status);
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
    const text = this.getAttribute("text");
    if (text && !snack) {
      const body = document.createElement("div");
      body.className = "inline-notification__body";
      body.textContent = text;
      content.appendChild(body);
    }
    if (this.#actions.length) {
      const actions = document.createElement("div");
      actions.className = "inline-notification__actions";
      for (const action of this.#actions) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "button";
        // Ghost by default: the action must not outweigh the message.
        button.dataset.variant = action.variant ?? "ghost";
        button.textContent = action.label;
        button.addEventListener("click", () => {
          action.onClick?.();
          if (!action.keepOpen) this.#close("action");
        });
        actions.appendChild(button);
      }
      content.appendChild(actions);
    }
    root.appendChild(content);

    if (boolAttr(this, "closable", true)) {
      const region = document.createElement("span");
      region.className = "inline-notification__close";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "button button--icon-only";
      close.dataset.variant = "ghost";
      close.setAttribute(
        "aria-label",
        this.getAttribute("close-label") ??
          t(localeAnchors.get(this) ?? this, "inlineNotification.close"),
      );
      close.innerHTML = closeIcon();
      close.addEventListener("click", () => this.#close("user"));
      region.appendChild(close);
      root.appendChild(region);
    }

    this.replaceChildren(root);
    this.#rendered = true;
    if (focused >= 0) {
      const buttons = this.querySelectorAll("button");
      buttons.item(Math.min(focused, buttons.length - 1))?.focus();
    }
  }
}
