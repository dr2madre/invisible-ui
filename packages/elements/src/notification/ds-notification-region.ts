import { i18n } from "@design-system/core";
import { boolAttr, definePart, emit, HTMLElementBase, nextId, numberAttr } from "../internal/base";
import { LOCALE_CHANGE_EVENT, localeScope, localized, onLocaleChange } from "../internal/i18n";
import { hasOpenModal, onModalChange } from "../internal/modal-stack";
import { swipeDismiss, type SwipeDismissHandle } from "../internal/swipe";
import {
  DsNotification,
  localeAnchors,
  regionAnnounced,
  type NotificationAction,
  type NotificationDismissReason,
  type NotificationStatus,
} from "./ds-notification";

export type NotificationPlacement =
  "top-start" | "top-center" | "top-end" | "bottom-start" | "bottom-center" | "bottom-end";

/** Options accepted when showing a notification. */
export interface NotificationOptions {
  /** Stable id. A live id replaces that notification in place instead of stacking a new one. */
  id?: string;
  status?: NotificationStatus;
  title?: string;
  /** Body text. */
  text?: string;
  /** Auto-dismiss delay in ms. `0` (default) keeps it until dismissed. */
  duration?: number;
  /** Whether to render the close button. Defaults to `true`. */
  closable?: boolean;
  /** Live-region role: `status` (polite, default) or `alert` (urgent). */
  role?: "status" | "alert";
  actions?: NotificationAction[];
  /** High-contrast inverse surface. */
  inverted?: boolean;
  /** One compact row: icon, title and an inline action, no body text. */
  snack?: boolean;
  iconShape?: "rounded" | "round";
  iconBox?: "tint" | "transparent" | "solid";
  /** Called once when the notification closes, with the reason. Not called on a replace. */
  onDismiss?: (reason: NotificationDismissReason) => void;
}

/** A queued notification, with its id. */
export interface NotificationItem extends NotificationOptions {
  id: string;
}

/** Messages for `promise()`; success and error may derive from the result. */
export interface NotificationPromiseMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
  /** Auto-dismiss delay for the settled notification. Defaults to `0` (persistent). */
  duration?: number;
}

/** Options for the status shorthands: the method sets the status and the title. */
export type StatusOptions = Omit<NotificationOptions, "status" | "title">;

const PLACEMENTS = [
  "top-start",
  "top-center",
  "top-end",
  "bottom-start",
  "bottom-center",
  "bottom-end",
];
// How many dismissed notifications keep their paint order while they animate out.
const RECENT = 8;
// Text written right after a live region empties is announced more reliably.
const ANNOUNCE_DELAY = 100;

const resolveMessage = <A>(message: string | ((arg: A) => string), arg: A): string =>
  typeof message === "function" ? message(arg) : message;

/** A numeric attribute that cannot be negative: a negative value falls back. */
const countAttr = (element: Element, name: string, fallback: number) => {
  const value = numberAttr(element, name, fallback);
  return value >= 0 ? value : fallback;
};

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const nextFrame = (callback: () => void) =>
  requestAnimationFrame(() => requestAnimationFrame(callback));

/**
 * `<ds-notification-region>` — a fixed stack of notifications, ported from the
 * Svelte adapter with the Vue DOM. The element owns the queue: call `show()`
 * (or a status shorthand) and it renders a `<ds-notification>` for each entry.
 * The region is a labelled landmark (`role="region"`). It keeps two empty,
 * visually hidden live regions, one polite and one assertive (`role: "alert"`),
 * and writes each new or changed notification into one of them, so additions
 * are announced without moving focus. The notifications themselves are
 * groups named by their title, not live regions.
 *
 * The region is moved to `<body>` while the element is connected, so no
 * ancestor stacking context can paint over it. It keeps the element's
 * language and direction. Notifications shown before the element is
 * connected wait in the queue and appear once it is.
 *
 * While a modal dialog is open anywhere in the document, new notifications
 * wait in the queue, unshown and unannounced (ADR 0016): the dialog holds
 * the user's attention and makes the page behind it inert. When the last
 * modal closes they appear in order, and their auto-dismiss countdowns start
 * then. Notifications already shown when a modal opens stay, with their
 * countdowns held; a change to one of them is announced after the modal
 * closes. A message about the dialog's own task belongs in the dialog's
 * status area (`notify()` on the dialog), and a message that needs a
 * decision now belongs in a dialog opened on top.
 *
 * The newest notification is on top and past
 * `max-visible` the oldest leave. Hovering or focusing any notification holds
 * every countdown. Notifications enter, leave and reflow with motion, none
 * under reduced motion, and can be swiped away.
 *
 * Attributes: `placement` (`top-end` by default), `label` (the landmark name),
 * `max-visible` (`0`, no count cap), `inset` (distance from the viewport
 * edges, `1rem`), `swipeable` (on by default, `"false"` turns it off),
 * `duration` (enter and reflow ms, `200`), `exit-duration` (leave ms, 1.75
 * times `duration`).
 * Properties: `notifications` (the queue, oldest first, read only, including
 * the notifications waiting for a modal to close).
 * Methods: `show(options)` returns the id, `info`, `success`, `warning`, `danger` and
 * `neutral(title, options)`, `update(id, patch)`, `dismiss(id, reason)`,
 * `clear()`, `promise(promise, messages)`.
 * Emits: `dismiss` (`detail.id`, `detail.reason`) after a notification leaves
 * the queue.
 */
export class DsNotificationRegion extends HTMLElementBase {
  static observedAttributes = [
    "placement",
    "label",
    "max-visible",
    "inset",
    "swipeable",
    "duration",
    "exit-duration",
  ];

  #items: NotificationItem[] = [];
  #handlers = new Map<string, (reason: NotificationDismissReason) => void>();
  #notices = new Map<string, DsNotification>();
  #swipes = new Map<string, SwipeDismissHandle>();
  #paintOrder = new Map<string, number>();
  #region: HTMLDivElement | null = null;
  #polite: HTMLElement | null = null;
  #assertive: HTMLElement | null = null;
  // The text last announced for each notification.
  #announced = new Map<string, string>();
  // Messages waiting to be written, per live region.
  #pending = new Map<HTMLElement, { id: string; parts: string[] }[]>();
  // The notifications whose text each live region holds.
  #liveIds = new Map<HTMLElement, Set<string>>();
  #announceTimer: ReturnType<typeof setTimeout> | undefined;
  #pointerInside = false;
  #focusInside = false;
  // Whether a modal dialog is open in the document, and which notifications
  // have been shown: only those stay on screen while one is.
  #modalOpen = false;
  #shown = new Set<string>();
  #stopWatching: (() => void) | null = null;

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (!this.#region) return;
      this.#render();
      for (const notice of this.#notices.values()) {
        notice.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
      }
    });
  }

  connectedCallback() {
    definePart("ds-notification", DsNotification);
    this.#region ??= this.#createRegion();
    this.#modalOpen = hasOpenModal(this.ownerDocument);
    this.#stopWatching ??= onModalChange(this.ownerDocument, () => this.#syncModal());
    this.#render();
  }

  disconnectedCallback() {
    // Finishes a swipe the user already made; the handles come back on connect.
    for (const handle of this.#swipes.values()) handle.destroy();
    this.#swipes.clear();
    this.#region?.remove();
    this.#stopWatching?.();
    this.#stopWatching = null;
  }

  attributeChangedCallback() {
    this.#render();
  }

  /** The queue, oldest first. */
  get notifications(): NotificationItem[] {
    return this.#items.map((item) => ({ ...item }));
  }

  /** Queue a notification and return its id. A live `id` is replaced in place. */
  show(options: NotificationOptions = {}): string {
    if (options.id && this.#items.some((item) => item.id === options.id)) {
      this.update(options.id, options);
      return options.id;
    }
    const id = options.id ?? nextId("notice");
    if (options.onDismiss) this.#handlers.set(id, options.onDismiss);
    this.#items = [...this.#items, { ...options, id }];
    this.#render();
    return id;
  }

  info(title: string, options: StatusOptions = {}): string {
    return this.show({ ...options, status: "info", title });
  }
  success(title: string, options: StatusOptions = {}): string {
    return this.show({ ...options, status: "success", title });
  }
  warning(title: string, options: StatusOptions = {}): string {
    return this.show({ ...options, status: "warning", title });
  }
  danger(title: string, options: StatusOptions = {}): string {
    return this.show({ ...options, status: "danger", title });
  }
  neutral(title: string, options: StatusOptions = {}): string {
    return this.show({ ...options, status: "neutral", title });
  }

  /** Change a live notification in place. */
  update(id: string, patch: NotificationOptions): void {
    if (patch.onDismiss) this.#handlers.set(id, patch.onDismiss);
    this.#items = this.#items.map((item) => (item.id === id ? { ...item, ...patch, id } : item));
    this.#render();
  }

  /** Remove a notification, telling its `onDismiss` why (`api` by default). */
  dismiss(id: string, reason: NotificationDismissReason = "api"): void {
    const existed = this.#items.some((item) => item.id === id);
    this.#items = this.#items.filter((item) => item.id !== id);
    const handler = this.#handlers.get(id);
    this.#handlers.delete(id);
    if (!existed) return;
    this.#render();
    handler?.(reason);
    emit(this, "dismiss", { id, reason });
  }

  /** Remove every notification, each told `api`. */
  clear(): void {
    // The queue empties first (ADR 0011): a handler that shows a new
    // notification keeps it.
    const cleared = this.#items;
    this.#items = [];
    this.#render();
    for (const item of cleared) {
      const handler = this.#handlers.get(item.id);
      this.#handlers.delete(item.id);
      handler?.("api");
      emit(this, "dismiss", { id: item.id, reason: "api" });
    }
  }

  /** Show a loading notification, then turn it into success or error when the promise settles. */
  async promise<T>(promise: Promise<T>, messages: NotificationPromiseMessages<T>): Promise<T> {
    const duration = messages.duration ?? 0;
    const id = this.show({ status: "info", title: messages.loading, duration: 0, closable: false });
    try {
      const data = await promise;
      this.update(id, {
        status: "success",
        title: resolveMessage(messages.success, data),
        duration,
        closable: true,
      });
      return data;
    } catch (error) {
      this.update(id, {
        status: "danger",
        title: resolveMessage(messages.error, error),
        duration,
        closable: true,
        role: "alert",
      });
      throw error;
    }
  }

  #createRegion() {
    const region = document.createElement("div");
    region.className = "notification-region";
    region.setAttribute("role", "region");
    const live = (role: "status" | "alert") => {
      const element = document.createElement("div");
      element.className = "notification-region__live";
      element.setAttribute("role", role);
      element.setAttribute("aria-atomic", "true");
      region.appendChild(element);
      return element;
    };
    this.#polite = live("status");
    this.#assertive = live("alert");
    const inside = (target: EventTarget | null) =>
      target instanceof Node && region.contains(target);
    region.addEventListener("pointerover", () => this.#setPointer(true));
    region.addEventListener("pointerout", (event) => {
      if (!inside(event.relatedTarget)) this.#setPointer(false);
    });
    region.addEventListener("focusin", () => this.#setFocus(true));
    region.addEventListener("focusout", (event) => {
      if (!inside(event.relatedTarget)) this.#setFocus(false);
    });
    return region;
  }

  #setPointer(inside: boolean) {
    this.#pointerInside = inside;
    this.#syncPaused();
  }

  #setFocus(inside: boolean) {
    this.#focusInside = inside;
    this.#syncPaused();
  }

  #syncModal() {
    const open = hasOpenModal(this.ownerDocument);
    if (open === this.#modalOpen) return;
    this.#modalOpen = open;
    this.#render();
  }

  #isPaused() {
    return this.#pointerInside || this.#focusInside || this.#modalOpen;
  }

  #syncPaused() {
    const paused = this.#isPaused();
    for (const notice of this.#notices.values()) notice.paused = paused;
  }

  #motion() {
    return prefersReducedMotion() ? 0 : countAttr(this, "duration", 200);
  }

  #motionOut() {
    if (prefersReducedMotion()) return 0;
    return countAttr(this, "exit-duration", Math.round(countAttr(this, "duration", 200) * 1.75));
  }

  #placement(): NotificationPlacement {
    const placement = this.getAttribute("placement") ?? "";
    return (PLACEMENTS.includes(placement) ? placement : "top-end") as NotificationPlacement;
  }

  #render() {
    const region = this.#region;
    // Before the element is connected the queue only collects; connecting
    // renders it.
    if (!region || !this.isConnected) return;
    const root = this.ownerDocument.body;
    if (region.parentElement !== root) root.appendChild(region);
    const { locale } = localeScope(this);
    region.dataset.placement = this.#placement();
    region.setAttribute("aria-label", localized(this, "label", "notificationRegion.label"));
    region.lang = locale;
    region.dir = this.closest("[dir]")?.getAttribute("dir") ?? i18n.localeDirection(locale);
    region.style.padding = this.getAttribute("inset") ?? "1rem";
    // Private variables, set from the attributes so no outside override wins.
    region.style.setProperty("--_notice-motion", `${this.#motion()}ms`);
    region.style.setProperty("--_notice-motion-out", `${this.#motionOut()}ms`);

    // While a modal is open, only what was already on screen stays there.
    const ids = new Set(this.#items.map((item) => item.id));
    for (const id of this.#shown) if (!ids.has(id)) this.#shown.delete(id);
    const eligible = this.#modalOpen
      ? this.#items.filter((item) => this.#shown.has(item.id))
      : this.#items;
    const max = countAttr(this, "max-visible", 0);
    // New notifications always enter; past the cap the oldest leave.
    const visible = max > 0 ? eligible.slice(-max) : eligible;
    for (const item of visible) this.#shown.add(item.id);
    this.#updatePaintOrder(visible);

    const before = new Map<DsNotification, DOMRect>();
    for (const notice of this.#notices.values()) {
      if (notice.isConnected) before.set(notice, notice.getBoundingClientRect());
    }

    const showing = new Set(visible.map((item) => item.id));
    for (const id of this.#announced.keys()) if (!showing.has(id)) this.#announced.delete(id);
    for (const [id, notice] of this.#notices) {
      if (showing.has(id)) continue;
      this.#notices.delete(id);
      this.#swipes.get(id)?.destroy();
      this.#swipes.delete(id);
      this.#leave(notice);
    }

    const paused = this.#isPaused();
    const entering: DsNotification[] = [];
    let after: Node | null = null;
    for (const item of [...visible].reverse()) {
      let notice = this.#notices.get(item.id);
      if (!notice) {
        notice = this.#createNotice(item.id);
        this.#notices.set(item.id, notice);
      }
      this.#applyItem(notice, item);
      // Behind a modal nothing is announced; closing it renders again.
      if (!this.#modalOpen) this.#announce(item);
      notice.paused = paused;
      notice.style.zIndex = String(100000 - (this.#paintOrder.get(item.id) ?? 0));
      if (!notice.isConnected) {
        region.insertBefore(notice, after);
        entering.push(notice);
      }
      after = notice;
      const swipe = this.#swipes.get(item.id);
      const options = this.#swipeOptions(item.id);
      if (swipe) swipe.update(options);
      else this.#swipes.set(item.id, swipeDismiss(notice, options));
    }

    for (const notice of entering) this.#enter(notice);
    this.#move(before);
    this.#clearStale(showing);
  }

  #announce(item: NotificationItem) {
    const parts = [item.title, item.snack ? undefined : item.text].filter(
      (part): part is string => !!part,
    );
    const message = parts.join("\n");
    if (this.#announced.get(item.id) === message) return;
    this.#announced.set(item.id, message);
    if (!message) return;
    const live = item.role === "alert" ? this.#assertive! : this.#polite!;
    let queue = this.#pending.get(live);
    if (!queue) {
      // Emptied first, so the same text shown twice is still a change.
      live.textContent = "";
      this.#liveIds.delete(live);
      queue = [];
      this.#pending.set(live, queue);
    }
    queue.push({ id: item.id, parts });
    if (this.#announceTimer === undefined) {
      this.#announceTimer = setTimeout(() => this.#flushAnnouncements(), ANNOUNCE_DELAY);
    }
  }

  #flushAnnouncements() {
    this.#announceTimer = undefined;
    for (const [live, pending] of this.#pending) {
      // A notification dismissed before its turn is not announced.
      const queue = pending.filter(({ id }) => this.#announced.has(id));
      if (!queue.length) continue;
      // One paragraph per line, spaced so the text also reads as words.
      const lines = queue.flatMap(({ parts }) =>
        parts.flatMap((part) => {
          const line = document.createElement("p");
          line.textContent = part;
          return [line, document.createTextNode(" ")];
        }),
      );
      live.replaceChildren(...lines);
      this.#liveIds.set(live, new Set(queue.map(({ id }) => id)));
    }
    this.#pending.clear();
  }

  /** Empty a live region once none of the notifications it announced is shown. */
  #clearStale(showing: Set<string>) {
    for (const [live, ids] of this.#liveIds) {
      if ([...ids].some((id) => showing.has(id))) continue;
      live.textContent = "";
      this.#liveIds.delete(live);
    }
  }

  #updatePaintOrder(visible: NotificationItem[]) {
    // Older paints higher, so each notification covers the shadow of the newer
    // one above it; a leaving one keeps its place while it animates out.
    let seq = this.#paintOrder.size;
    for (const item of visible)
      if (!this.#paintOrder.has(item.id)) this.#paintOrder.set(item.id, ++seq);
    const showing = new Set(visible.map((item) => item.id));
    const gone = [...this.#paintOrder.keys()].filter((id) => !showing.has(id));
    for (const id of gone.slice(0, Math.max(0, gone.length - RECENT))) this.#paintOrder.delete(id);
    // Numbered again from one, so the order never runs out of its range.
    let renumbered = 0;
    for (const id of [...this.#paintOrder.keys()]) this.#paintOrder.set(id, ++renumbered);
  }

  #createNotice(id: string) {
    const notice = new DsNotification();
    notice.classList.add("notice-slot");
    regionAnnounced.add(notice);
    localeAnchors.set(notice, this);
    notice.addEventListener("close", (event) => {
      event.preventDefault();
      this.dismiss(id, (event as CustomEvent<{ reason: NotificationDismissReason }>).detail.reason);
    });
    return notice;
  }

  #applyItem(notice: DsNotification, item: NotificationItem) {
    const set = (name: string, value: string | null) => {
      if (value == null) notice.removeAttribute(name);
      else if (notice.getAttribute(name) !== value) notice.setAttribute(name, value);
    };
    const flag = (value: boolean | undefined) => (value ? "" : null);
    set("status", item.status ?? null);
    set("title", item.title ?? null);
    set("text", item.text ?? null);
    set("duration", item.duration ? String(item.duration) : null);
    set("closable", item.closable === false ? "false" : null);
    set("inverted", flag(item.inverted));
    set("snack", flag(item.snack));
    set("icon-shape", item.iconShape ?? null);
    set("icon-box", item.iconBox ?? null);
    const actions = item.actions ?? [];
    if (notice.actions !== actions && (actions.length || notice.actions.length)) {
      notice.actions = actions;
    }
  }

  #swipeOptions(id: string) {
    return {
      disabled: !boolAttr(this, "swipeable", true),
      onDismiss: () => this.dismiss(id, "user"),
    };
  }

  #enter(notice: DsNotification) {
    const ms = this.#motion();
    if (!ms) return;
    notice.classList.add("notice-enter-from", "notice-enter-active");
    void notice.offsetHeight;
    nextFrame(() => {
      notice.classList.remove("notice-enter-from");
      notice.classList.add("notice-enter-to");
      setTimeout(() => notice.classList.remove("notice-enter-active", "notice-enter-to"), ms + 50);
    });
  }

  #leave(notice: DsNotification) {
    // A leaving notification takes no input. Removing an element fires no
    // focusout or pointerout, so the stack would otherwise stay paused.
    notice.inert = true;
    if (notice.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    const remove = () => {
      notice.remove();
      this.#pointerInside = !!this.#region?.querySelector(".notice-slot:hover:not([inert])");
      this.#syncPaused();
    };
    const ms = this.#motionOut();
    if (!ms) {
      remove();
      return;
    }
    notice.classList.add("notice-leave-from", "notice-leave-active");
    void notice.offsetHeight;
    nextFrame(() => {
      notice.classList.remove("notice-leave-from");
      notice.classList.add("notice-leave-to");
    });
    setTimeout(remove, ms + 50);
  }

  /** Slide the notifications that stayed from their old place to the new one. */
  #move(before: Map<DsNotification, DOMRect>) {
    const ms = this.#motionOut();
    if (!ms) return;
    const moved: DsNotification[] = [];
    for (const [notice, first] of before) {
      if (!notice.isConnected || notice.inert) continue;
      const last = notice.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (!dx && !dy) continue;
      notice.style.transform = `translate(${dx}px, ${dy}px)`;
      notice.style.transitionDuration = "0s";
      moved.push(notice);
    }
    if (!moved.length) return;
    void this.#region!.offsetHeight;
    for (const notice of moved) {
      notice.classList.add("notice-move");
      notice.style.transform = "";
      notice.style.transitionDuration = "";
      setTimeout(() => notice.classList.remove("notice-move"), ms + 50);
    }
  }
}
