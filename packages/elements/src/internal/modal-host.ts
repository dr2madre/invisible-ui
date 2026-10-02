import { boolAttr, emit, HTMLElementBase, upgradeProperty } from "./base";
import { DialogStatus, type DialogNoticeOptions } from "./dialog-status";
import { onLocaleChange } from "./i18n";
import { returnFocus, trackModal } from "./modal-stack";
import { lockScroll } from "./scroll-lock";

/** A styled button (the `.button` rules of button.css). */
export function createButton(variant = "default"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button";
  button.dataset.variant = variant;
  return button;
}

export interface ModalOptions {
  /** Close as a user action: Escape, the panel's own `close`, a backdrop press. */
  dismiss: () => void;
  /** Whether a backdrop press closes the dialog right now. */
  closesOnOutsidePress: () => boolean;
  /** CSS selector, within the panel, of the element focused on open; else the panel. */
  initialFocus: string | null;
  /** The status area, emptied when the dialog closes (ADR 0016). */
  status: DialogStatus;
  /** Runs right after the panel closed, before the page is released. */
  afterClose?: () => void;
  /** Give focus back, last, given the element that had it at open. */
  restoreFocus: (previouslyFocused: HTMLElement | null) => void;
}

/**
 * Show `panel` as a modal (ADR 0005) and return the cleanup that closes it.
 * Top layer and inert background come from `showModal()`; this adds the
 * modal registry, scroll lock, Escape, backdrop light dismiss and initial
 * focus, and on close empties the status area and gives focus back. The one
 * open sequence of `<ds-dialog>`, `<ds-sheet-dialog>` and the presets.
 */
export function openModal(panel: HTMLDialogElement, options: ModalOptions): () => void {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  panel.showModal();
  const releaseModal = trackModal(panel);
  const releaseScroll = lockScroll();

  const onCancel = (event: Event) => {
    event.preventDefault();
    options.dismiss();
  };
  // Only the panel's own close: an element inside it, such as a closable
  // inline notification, emits a bubbling `close` too.
  const onClose = (event: Event) => {
    if (event.target === panel) options.dismiss();
  };
  // With the page inert, backdrop presses target the <dialog> itself; a
  // press whose coordinates fall outside the panel box is a light dismiss.
  const onPointerDown = (event: PointerEvent) => {
    if (!options.closesOnOutsidePress() || event.target !== panel) return;
    const rect = panel.getBoundingClientRect();
    const inside =
      rect.top <= event.clientY &&
      event.clientY <= rect.bottom &&
      rect.left <= event.clientX &&
      event.clientX <= rect.right;
    if (!inside) {
      event.preventDefault();
      options.dismiss();
    }
  };

  panel.addEventListener("cancel", onCancel);
  panel.addEventListener("close", onClose);
  panel.addEventListener("pointerdown", onPointerDown);

  // `showModal()` focuses the first focusable, which can be the close
  // button; the caller names its own starting point instead.
  const target = options.initialFocus
    ? panel.querySelector<HTMLElement>(options.initialFocus)
    : null;
  (target ?? panel).focus();

  return () => {
    panel.removeEventListener("cancel", onCancel);
    panel.removeEventListener("close", onClose);
    panel.removeEventListener("pointerdown", onPointerDown);
    if (panel.open) panel.close();
    options.afterClose?.();
    releaseModal();
    releaseScroll();
    options.status.clear();
    options.restoreFocus(previouslyFocused);
  };
}

/**
 * The shared shell of the dialog presets (internal): an opener button plus a
 * native `<dialog>` shown with `showModal()` (ADR 0005), the same modal
 * contract as `<ds-dialog>`: scroll lock, Escape, backdrop light dismiss,
 * initial focus and focus restore to the trigger.
 *
 * The panel is in the page only while open, as in the other adapters: a
 * closed preset has no dialog in the DOM, and a panel whose stylesheet sets
 * its own `display` never shows while closed.
 *
 * Every preset has the status area of `<ds-dialog>` (ADR 0016): each places
 * `status.parts` before its actions, and `notify()`, `dismissNotice()` and
 * `clearNotices()` follow the same contract. Closing returns focus to the
 * element that had it when the preset opened, so a preset opened from inside
 * another dialog hands focus back there; otherwise to the trigger.
 */
export abstract class ModalHost extends HTMLElementBase {
  protected trigger!: HTMLButtonElement;
  protected panel: HTMLDialogElement | null = null;
  /** The status area; each preset places `status.parts` in its panel. */
  protected readonly status = new DialogStatus(this, () => this.panel);
  #cleanup: (() => void) | null = null;

  /** Build the trigger and the panel, once. */
  protected abstract render(): void;
  /** Reflect the host's attributes onto the parts; ends with `syncModal()`. */
  protected abstract sync(): void;
  /** CSS selector, within the panel, of the element focused on open. */
  protected abstract readonly initialFocus: string;
  /** Whether a backdrop press closes the dialog right now. */
  protected closesOnOutsidePress(): boolean {
    return !boolAttr(this, "no-outside-close");
  }
  /** Reset per-opening state before the panel is shown. */
  protected willOpen(): void {}

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (!this.panel) return;
      this.sync();
      this.status.relabel();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "open");
    if (!this.panel) this.render();
    this.sync();
  }

  disconnectedCallback() {
    this.#cleanup?.();
    this.#cleanup = null;
  }

  attributeChangedCallback() {
    if (this.panel) this.sync();
  }

  get open(): boolean {
    return boolAttr(this, "open");
  }
  set open(value: boolean) {
    this.toggleAttribute("open", value);
  }

  /** Show a notice in the status area and return its id (ADR 0016). */
  notify(options: DialogNoticeOptions): string {
    return this.status.notify(options);
  }

  /** Remove one notice from the status area. */
  dismissNotice(id: string): void {
    this.status.dismiss(id);
  }

  /** Remove every notice from the status area. */
  clearNotices(): void {
    this.status.clear();
  }

  /** A change the user asked for: it updates the state and reports it. */
  protected setOpen = (next: boolean) => {
    if (this.open === next) return;
    this.open = next;
    emit(this, "open-change", { open: next });
    this.didChangeOpen(next);
  };

  /** Runs after a user-driven open change has been reported. */
  protected didChangeOpen(_open: boolean): void {}

  /** Take the children marked `slot="<name>"` out of the host, read once. */
  protected takeSlot(name: string): Element[] {
    const claimed = Array.from(this.children).filter(
      (child) => child.getAttribute("slot") === name,
    );
    for (const child of claimed) child.removeAttribute("slot");
    return claimed;
  }

  protected syncModal() {
    // A disconnected <dialog> cannot be shown; connecting syncs again.
    if (this.open && !this.#cleanup && this.isConnected) this.#show();
    if (!this.open && this.#cleanup) {
      this.#cleanup();
      this.#cleanup = null;
    }
  }

  #show() {
    const panel = this.panel!;
    this.willOpen();
    this.append(panel);
    this.#cleanup = openModal(panel, {
      dismiss: () => this.setOpen(false),
      closesOnOutsidePress: () => this.closesOnOutsidePress(),
      initialFocus: this.initialFocus,
      status: this.status,
      afterClose: () => panel.remove(),
      restoreFocus: (previous) => returnFocus(previous, this.trigger),
    });
  }
}
