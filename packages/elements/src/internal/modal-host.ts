import { boolAttr, emit, HTMLElementBase, upgradeProperty } from "./base";
import { onLocaleChange } from "./i18n";
import { lockScroll } from "./scroll-lock";

/** A styled button (the `.button` rules of button.css). */
export function createButton(variant = "default"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button";
  button.dataset.variant = variant;
  return button;
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
 */
export abstract class ModalHost extends HTMLElementBase {
  protected trigger!: HTMLButtonElement;
  protected panel: HTMLDialogElement | null = null;
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
      if (this.panel) this.sync();
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
    if (this.open && !this.#cleanup) this.#show();
    if (!this.open && this.#cleanup) {
      this.#cleanup();
      this.#cleanup = null;
    }
  }

  #show() {
    const panel = this.panel!;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    this.willOpen();
    this.append(panel);
    // Top layer + inert background come from the platform.
    panel.showModal();
    const releaseScroll = lockScroll();

    const onCancel = (event: Event) => {
      event.preventDefault();
      this.setOpen(false);
    };
    const onClose = () => this.setOpen(false);
    // With the page inert, backdrop presses target the <dialog> itself; a
    // press whose coordinates fall outside the panel box is a light dismiss.
    const onPointerDown = (event: PointerEvent) => {
      if (!this.closesOnOutsidePress() || event.target !== panel) return;
      const rect = panel.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;
      if (!inside) {
        event.preventDefault();
        this.setOpen(false);
      }
    };

    panel.addEventListener("cancel", onCancel);
    panel.addEventListener("close", onClose);
    panel.addEventListener("pointerdown", onPointerDown);

    // `showModal()` focuses the first focusable, which can be the close
    // button; each preset names its own starting point instead.
    const target = panel.querySelector<HTMLElement>(this.initialFocus);
    (target ?? panel).focus();

    this.#cleanup = () => {
      panel.removeEventListener("cancel", onCancel);
      panel.removeEventListener("close", onClose);
      panel.removeEventListener("pointerdown", onPointerDown);
      if (panel.open) panel.close();
      panel.remove();
      releaseScroll();
      const restore = this.trigger ?? previouslyFocused;
      if (restore?.isConnected) restore.focus();
    };
  }
}
