import { navigationBar } from "@invisible-ui/core";
import { hasOpenModal, onModalChange } from "./modal-stack";

type Translate = NonNullable<navigationBar.TextOptions["translate"]>;

/**
 * The polite live region of a navigation, Navigation Bar or Sidebar: a badge
 * that appears or changes is announced once, never for the first
 * destinations, and while a modal dialog outside the navigation is open the
 * latest one per destination waits for it to close (ADR 0016). The element
 * places `node` and calls `connect`, `disconnect`, `reset` and `update`.
 */
export class BadgeLive {
  readonly node: HTMLDivElement;
  #announcer = navigationBar.createBadgeAnnouncer();
  #stop: (() => void) | null = null;

  constructor(className: string) {
    this.node = document.createElement("div");
    this.node.className = className;
    this.node.setAttribute("aria-live", "polite");
  }

  connect() {
    this.#stop?.();
    this.#stop = onModalChange(document, () =>
      this.#speak(this.#announcer.release(this.#blocked())),
    );
  }

  disconnect() {
    this.#stop?.();
    this.#stop = null;
  }

  /** Records `targets` as the first render: nothing is announced for them. */
  reset(targets: readonly navigationBar.NavigationTarget[]) {
    this.#announcer.reset();
    if (targets.length > 0) this.#announcer.update(targets, () => false);
  }

  /** Announces the badges that appeared or changed since the last call. */
  update(targets: readonly navigationBar.NavigationTarget[], translate: Translate) {
    this.#speak(this.#announcer.update(targets, () => this.#blocked(), { translate }));
  }

  #blocked() {
    return hasOpenModal(document, this.node);
  }

  #speak(announcements: navigationBar.BadgeAnnouncement[]) {
    if (announcements.length === 0) return;
    this.node.replaceChildren(
      ...announcements.map(({ text }) => {
        const span = document.createElement("span");
        span.textContent = text;
        return span;
      }),
    );
  }
}
