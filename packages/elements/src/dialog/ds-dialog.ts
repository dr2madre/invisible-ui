import { dialog as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import {
  createDialogHeader,
  syncDialogHeader,
  type DialogHeaderParts,
} from "../internal/dialog-header";
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
 * Composition regions are marked on light-DOM children with a `slot`
 * attribute, read once when the element renders (no Shadow DOM, ADR 0008):
 * `slot="icon"` for a leading feedback icon, `slot="header-lead"` for a leading
 * ghost button, `slot="header-meta"` for context above the title,
 * `slot="header-actions"` for actions before the close button,
 * `slot="footer-lead"` for leading footer actions such as Back, and
 * `slot="footer"` for the trailing actions. Children without a `slot`
 * attribute stay the body. These are the equivalents of the `icon`,
 * `headerLead`, `headerMeta`, `headerActions`, `footerLead` and `footer`
 * regions in the Svelte, Vue and React adapters; the header is the one the
 * whole dialog family shares.
 *
 * Attributes: `heading` (required — the global `title` attribute is a browser
 * tooltip and cannot be used), `description`, `trigger` (opener text),
 * `trigger-variant`, `open`, `close-label`, `close-button` (`"false"` drops
 * the close button), `initial-focus` (CSS selector),
 * `no-outside-close`, `body-layout` (`plain` by default, or `stack` to space
 * the body's direct sections by `--ds-dialog-body-gap`).
 * Properties: `open` (boolean).
 *
 * `initial-focus` and `no-outside-close` are read at the moment they apply —
 * when the dialog opens, and when a pointer goes down outside it — so they
 * follow the host without being observed.
 *
 * Emits: bubbling `open-change` CustomEvent with `detail.open`.
 */
export class DsDialog extends HTMLElementBase {
  static observedAttributes = [
    "open",
    "heading",
    "description",
    "trigger",
    "trigger-variant",
    "close-label",
    "close-button",
    "body-layout",
  ];

  #trigger: HTMLButtonElement | null = null;
  #panel: HTMLDialogElement | null = null;
  #body: HTMLDivElement | null = null;
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

  // A child marked `slot="…"` belongs to that region; everything else is body
  // content. The children are read once, here, and moved into place.
  #takeSlot(name: string): Element[] {
    const claimed = Array.from(this.children).filter(
      (child) => child.getAttribute("slot") === name,
    );
    for (const child of claimed) child.removeAttribute("slot");
    return claimed;
  }

  #region(className: string, children: Element[]): HTMLDivElement | null {
    if (children.length === 0) return null;
    const region = document.createElement("div");
    region.className = className;
    region.append(...children);
    return region;
  }

  #render() {
    // Read the marked regions first, so what stays becomes the body.
    const iconContent = this.#takeSlot("icon");
    const leadContent = this.#takeSlot("header-lead");
    const metaContent = this.#takeSlot("header-meta");
    const actionsContent = this.#takeSlot("header-actions");
    const footerLeadContent = this.#takeSlot("footer-lead");
    const footerContent = this.#takeSlot("footer");

    const body = document.createElement("div");
    body.className = "dialog__body";
    while (this.firstChild) body.appendChild(this.firstChild);

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "button";

    const panel = document.createElement("dialog");
    panel.className = "dialog__panel";

    const header = createDialogHeader({
      icon: iconContent,
      lead: leadContent,
      meta: metaContent,
      actions: actionsContent,
    });

    panel.append(header.header, body);

    // One action bar: the leading group first, so source order matches focus
    // order, then the trailing group.
    const footerLead = this.#region("dialog__footer-lead", footerLeadContent);
    const footerActions = this.#region("dialog__footer-actions", footerContent);
    if (footerLead || footerActions) {
      const footer = document.createElement("footer");
      footer.className = "dialog__footer";
      if (footerLead) footer.append(footerLead);
      if (footerActions) footer.append(footerActions);
      panel.append(footer);
    }

    this.append(trigger, panel);

    this.#trigger = trigger;
    this.#panel = panel;
    this.#body = body;
    this.header = header;
  }

  private header!: DialogHeaderParts;

  // The ids wire the trigger to the panel and the panel to its title, so two
  // dialogs on one page need two of them: a shared fallback made every
  // aria-controls and aria-labelledby resolve to whichever mounted first.
  #instanceId = nextId("ds-dialog");

  #sync() {
    const describedBy = this.getAttribute("description") != null;
    const api = core.connect({
      state: {
        open: this.open,
        id: this.id || this.#instanceId,
        role: "dialog",
      },
      setOpen: this.#setOpen,
      describedBy,
    });

    syncDialogHeader(this.header, {
      heading: this.getAttribute("heading") ?? "",
      subtitle: this.getAttribute("description"),
      closeButton: boolAttr(this, "close-button", true),
      closeLabel: this.getAttribute("close-label") ?? "Close",
    });

    this.#body!.dataset.layout = this.getAttribute("body-layout") ?? "plain";
    this.#trigger!.textContent = this.getAttribute("trigger") ?? "Open";
    this.#trigger!.dataset.variant = this.getAttribute("trigger-variant") ?? "default";

    applyProps(this.#trigger!, api.triggerProps);
    applyProps(this.#panel!, api.contentProps);
    applyProps(this.header.heading, api.titleProps);
    if (describedBy) applyProps(this.header.subtitle, api.descriptionProps);
    applyProps(this.header.close, api.closeProps);

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
      if (!inside) {
        event.preventDefault();
        this.#setOpen(false);
      }
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
