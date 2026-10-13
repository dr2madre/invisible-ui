import { navigationBar } from "@design-system/core";
import type { Attachment } from "svelte/attachments";
import type { TranslateFn } from "../i18n/create-i18n";
import { hasOpenModal, onModalChange } from "./modal-stack";

/**
 * The polite live region of a navigation, Navigation Bar or Sidebar: a badge
 * that appears or changes is announced once, never on mount, and while a
 * modal dialog outside the navigation is open the latest one per destination
 * waits for it to close (ADR 0016). `spoken` is what the region says;
 * `attach` goes on the region itself.
 */
export class BadgeAnnouncements {
  spoken: navigationBar.BadgeAnnouncement[] = $state.raw([]);
  #announcer = navigationBar.createBadgeAnnouncer();
  #live: HTMLElement | undefined;

  constructor(
    targets: () => readonly navigationBar.NavigationTarget[],
    translate: () => TranslateFn,
  ) {
    $effect(() => {
      const said = this.#announcer.update(targets(), () => this.#blocked(), {
        translate: translate(),
      });
      if (said.length > 0) this.spoken = said;
    });
  }

  #blocked() {
    return !!this.#live && hasOpenModal(this.#live.ownerDocument, this.#live);
  }

  attach: Attachment<HTMLElement> = (node) => {
    this.#live = node;
    const stop = onModalChange(node.ownerDocument, () => {
      const said = this.#announcer.release(this.#blocked());
      if (said.length > 0) this.spoken = said;
    });
    return () => {
      stop();
      this.#live = undefined;
    };
  };
}
