import { closeIcon, feedbackIcon, type FeedbackStatus } from "./icons";
import { t } from "./i18n";

/** The button a dialog notice offers, such as Retry after a failed upload. */
export interface DialogNoticeAction {
  label: string;
  /** Runs when the button is pressed; the notice then closes. */
  onAction: () => void;
}

/** A message about the dialog's own task, shown in its status area (ADR 0016). */
export interface DialogNoticeOptions {
  /** `info` by default. */
  status?: FeedbackStatus;
  title: string;
  description?: string;
  action?: DialogNoticeAction;
  /** Whether the notice has a close button. Defaults to `true`. */
  dismissible?: boolean;
}

const STATUSES: FeedbackStatus[] = ["info", "success", "warning", "danger", "neutral"];
// Text written right after a live region empties is announced more reliably.
const ANNOUNCE_DELAY = 100;

let counter = 0;

/**
 * The status area of a dialog (internal): notices about the dialog's own
 * task, between the body and the footer, and one persistent polite live
 * region that announces each notice once, when it is added. The notices use
 * the Inline Notification markup; they are groups named by their title and
 * never take focus. The area is hidden while it holds no notice; the live
 * region stays in the panel, visually hidden, so it is never created at the
 * moment it speaks.
 *
 * Notices belong to one opening of the dialog: `notify()` on a closed dialog
 * shows nothing, and closing the dialog clears them.
 */
export class DialogStatus {
  readonly area: HTMLDivElement;
  readonly live: HTMLDivElement;
  #notices = new Map<string, HTMLElement>();
  #pending: { id: string; parts: string[] }[] = [];
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly host: HTMLElement,
    private readonly panel: () => HTMLDialogElement | null,
  ) {
    this.area = document.createElement("div");
    this.area.className = "dialog-status";
    this.area.hidden = true;
    this.live = document.createElement("div");
    this.live.className = "dialog-status__live";
    this.live.setAttribute("role", "status");
    this.live.setAttribute("aria-atomic", "true");
  }

  /** The area and the live region, in the order they go into the panel. */
  get parts(): HTMLElement[] {
    return [this.area, this.live];
  }

  notify(options: DialogNoticeOptions): string {
    const panel = this.panel();
    if (!panel?.open) return "";
    const id = `dialog-notice-${++counter}`;
    const notice = this.#build(id, options);
    this.#notices.set(id, notice);
    this.area.append(notice);
    this.area.hidden = false;
    this.#announce(id, [options.title, options.description ?? ""].filter(Boolean));
    return id;
  }

  dismiss(id: string): void {
    const notice = this.#notices.get(id);
    if (!notice) return;
    this.#notices.delete(id);
    this.#pending = this.#pending.filter((entry) => entry.id !== id);
    // Removing the element that holds focus would drop focus to the page:
    // the panel takes it, the way it does when the dialog opens.
    const hadFocus = notice.contains(document.activeElement);
    notice.remove();
    this.area.hidden = this.#notices.size === 0;
    if (hadFocus) this.panel()?.focus();
  }

  /** Remove every notice; the dialog closing hands focus back on its own. */
  clear(): void {
    for (const notice of this.#notices.values()) notice.remove();
    this.#notices.clear();
    this.area.hidden = true;
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#pending = [];
    this.live.textContent = "";
  }

  /** Follow a locale change: the close buttons are named from the catalog. */
  relabel(): void {
    const label = t(this.host, "inlineNotification.close");
    for (const close of this.area.querySelectorAll(".inline-notification__close button")) {
      close.setAttribute("aria-label", label);
    }
  }

  #announce(id: string, parts: string[]) {
    this.#pending.push({ id, parts });
    if (this.#timer !== undefined) return;
    // Emptied first, so the same text twice is still a change.
    this.live.textContent = "";
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      const lines = this.#pending.flatMap(({ parts }) =>
        parts.flatMap((part) => {
          const line = document.createElement("p");
          line.textContent = part;
          return [line, document.createTextNode(" ")];
        }),
      );
      this.#pending = [];
      if (lines.length) this.live.replaceChildren(...lines);
    }, ANNOUNCE_DELAY);
  }

  #build(id: string, options: DialogNoticeOptions): HTMLElement {
    const status = STATUSES.includes(options.status as FeedbackStatus)
      ? (options.status as FeedbackStatus)
      : "info";
    const notice = document.createElement("div");
    notice.setAttribute("role", "group");

    const root = document.createElement("div");
    root.className = "inline-notification";
    root.dataset.status = status;

    const icon = document.createElement("span");
    icon.className = "feedback-icon";
    icon.dataset.status = status;
    icon.dataset.shape = "rounded";
    icon.dataset.box = "transparent";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = feedbackIcon(status);

    const content = document.createElement("div");
    content.className = "inline-notification__content";
    const title = document.createElement("p");
    title.className = "inline-notification__title";
    title.id = `${id}-title`;
    title.textContent = options.title;
    notice.setAttribute("aria-labelledby", title.id);
    content.append(title);
    if (options.description) {
      const body = document.createElement("div");
      body.className = "inline-notification__body";
      body.textContent = options.description;
      content.append(body);
    }
    const action = options.action;
    if (action) {
      const actions = document.createElement("div");
      actions.className = "inline-notification__actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button";
      // Ghost, as in a notification: the action must not outweigh the message.
      button.dataset.variant = "ghost";
      button.textContent = action.label;
      button.addEventListener("click", () => {
        action.onAction();
        this.dismiss(id);
      });
      actions.append(button);
      content.append(actions);
    }
    root.append(icon, content);

    if (options.dismissible !== false) {
      const region = document.createElement("span");
      region.className = "inline-notification__close";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "button button--icon-only";
      close.dataset.variant = "ghost";
      close.setAttribute("aria-label", t(this.host, "inlineNotification.close"));
      close.innerHTML = closeIcon();
      close.addEventListener("click", () => this.dismiss(id));
      region.append(close);
      root.append(region);
    }

    notice.append(root);
    return notice;
  }
}
