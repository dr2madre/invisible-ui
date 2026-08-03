import { dialog as core } from "@design-system/core";
import { applyProps, boolAttr, emit, HTMLElementBase, upgradeProperty } from "../internal/base";
import { closeIcon } from "../internal/icons";
import { lockScroll } from "../internal/scroll-lock";

/**
 * `<ds-dialog>` — the styled modal window on the native `<dialog>` element
 * (ADR 0005), as a custom element.
 *
 * The element's children become the dialog body; the `trigger` attribute
 * renders the opener button. Modality (top layer, inert background, real
 * focus trap, `::backdrop`) is the platform's via `showModal()`; this element
 * adds scroll lock, backdrop light-dismiss, `initial-focus` and focus
 * restore — the same contract as the Svelte and React adapters.
 *
 * Attributes: `heading` (required — the global `title` attribute is a browser
 * tooltip and cannot be used), `description`, `trigger` (opener text),
 * `trigger-variant`, `open`, `close-label`, `initial-focus` (CSS selector),
 * `no-outside-close`.
 * Properties: `open` (boolean).
 * Emits: bubbling `open-change` CustomEvent with `detail.open`.
 */
export class DsDialog extends HTMLElementBase {
  static observedAttributes = ["open", "heading", "description"];

  #trigger: HTMLButtonElement | null = null;
  #panel: HTMLDialogElement | null = null;
  #cleanup: (() => void) | null = null;

  connectedCallback() {
    upgradeProperty(this, "open");
    if (!this.#panel) this.#render();
    this.#sync();
  }

  disconnectedCallback() {
    this.#cleanup?.();
    this.#cleanup = null;
  }

  attributeChangedCallback() {
    if (this.#panel) this.#sync();
  }

  get open(): boolean {
    return boolAttr(this, "open");
  }
  set open(value: boolean) {
    this.toggleAttribute("open", value);
  }

  #setOpen = (next: boolean) => {
    if (this.open === next) return;
    this.open = next;
    emit(this, "open-change", { open: next });
  };

  #render() {
    // The element's children are the dialog body.
    const body = document.createElement("div");
    body.className = "dialog__body";
    while (this.firstChild) body.appendChild(this.firstChild);

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "button";
    trigger.dataset.variant = this.getAttribute("trigger-variant") ?? "default";
    trigger.textContent = this.getAttribute("trigger") ?? "Open";

    const panel = document.createElement("dialog");
    panel.className = "dialog__panel";

    const header = document.createElement("header");
    header.className = "dialog__header";

    const heading = document.createElement("h2");
    heading.className = "dialog__title";

    const subtitle = document.createElement("p");
    subtitle.className = "dialog__subtitle";
    subtitle.hidden = true;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "dialog__close";
    close.setAttribute("aria-label", this.getAttribute("close-label") ?? "Close");
    close.innerHTML = closeIcon();

    header.append(heading, subtitle, close);
    panel.append(header, body);
    this.append(trigger, panel);

    this.#trigger = trigger;
    this.#panel = panel;
    this.heading = heading;
    this.subtitle = subtitle;
    this.closeButton = close;
  }

  private heading!: HTMLHeadingElement;
  private subtitle!: HTMLParagraphElement;
  private closeButton!: HTMLButtonElement;

  #sync() {
    const describedBy = this.getAttribute("description") != null;
    const api = core.connect({
      state: {
        open: this.open,
        id: this.id || "ds-dialog-el",
        role: "dialog",
      },
      setOpen: this.#setOpen,
      describedBy,
    });

    this.heading.textContent = this.getAttribute("heading") ?? "";
    this.subtitle.hidden = !describedBy;
    this.subtitle.textContent = this.getAttribute("description") ?? "";

    applyProps(this.#trigger!, api.triggerProps);
    applyProps(this.#panel!, api.contentProps);
    applyProps(this.heading, api.titleProps);
    if (describedBy) applyProps(this.subtitle, api.descriptionProps);
    applyProps(this.closeButton, api.closeProps);

    if (this.open && !this.#cleanup) this.#show();
    if (!this.open && this.#cleanup) {
      this.#cleanup();
      this.#cleanup = null;
    }
  }

  #show() {
    const panel = this.#panel!;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Top layer + inert background come from the platform.
    panel.showModal();
    const releaseScroll = lockScroll();

    const onCancel = (event: Event) => {
      event.preventDefault();
      this.#setOpen(false);
    };
    const onClose = () => this.#setOpen(false);
    // With the page inert, backdrop presses target the <dialog> itself; a
    // press whose coordinates fall outside the panel box is a light dismiss.
    const onPointerDown = (event: PointerEvent) => {
      if (boolAttr(this, "no-outside-close") || event.target !== panel) return;
      const rect = panel.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.bottom &&
        rect.left <= event.clientX &&
        event.clientX <= rect.right;
      if (!inside) this.#setOpen(false);
    };

    panel.addEventListener("cancel", onCancel);
    panel.addEventListener("close", onClose);
    panel.addEventListener("pointerdown", onPointerDown);

    // `showModal()` focuses the first focusable; enforce our contract —
    // `initial-focus` when given, else the panel (never the close button).
    const selector = this.getAttribute("initial-focus");
    const target = selector ? panel.querySelector<HTMLElement>(selector) : null;
    (target ?? panel).focus();

    this.#cleanup = () => {
      panel.removeEventListener("cancel", onCancel);
      panel.removeEventListener("close", onClose);
      panel.removeEventListener("pointerdown", onPointerDown);
      if (panel.open) panel.close();
      releaseScroll();
      const restore = this.#trigger ?? previouslyFocused;
      if (restore?.isConnected) restore.focus();
    };
  }
}
