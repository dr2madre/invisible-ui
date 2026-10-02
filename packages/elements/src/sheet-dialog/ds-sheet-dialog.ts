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
import { DialogStatus, type DialogNoticeOptions } from "../internal/dialog-status";
import { openModal } from "../internal/modal-host";
import { returnFocus } from "../internal/modal-stack";
import { localized, onLocaleChange } from "../internal/i18n";

export type SheetDialogSide = "top" | "right" | "bottom" | "left";

/**
 * `<ds-sheet-dialog>` is an edge-anchored native modal dialog.
 *
 * Unslotted children form the body. Named regions are `icon`, `header-lead`,
 * `header-actions`, and `footer`; the header is the one the whole dialog
 * family shares, with the description as the subtitle under the title.
 *
 * Attributes: `heading` (required), `description`, `trigger`,
 * `trigger-variant`, `side`, `draggable`, `open`, `close-label`,
 * `close-button` (`"false"` drops the close button),
 * `initial-focus`, `render-trigger`, `return-focus-to`, `no-outside-close`.
 * Property: `open` (boolean).
 * Methods: `notify(options)`, `dismissNotice(id)`, `clearNotices()` (the status
 * area, ADR 0016).
 * Emits: `open-change` with `detail.open`.
 *
 * A status area between the body and the footer holds messages about the
 * sheet's own task (ADR 0016), with the same contract as `<ds-dialog>`:
 * notices announced once through a polite live region, never taking focus,
 * cleared when the sheet closes. Closing returns focus to `return-focus-to`
 * when the trigger is not rendered, else to the element that had focus when
 * the sheet opened, else to the trigger.
 */
export class DsSheetDialog extends HTMLElementBase {
  static observedAttributes = [
    "open",
    "heading",
    "description",
    "trigger",
    "trigger-variant",
    "side",
    "draggable",
    "close-label",
    "close-button",
    "render-trigger",
  ];

  #trigger: HTMLButtonElement | null = null;
  #panel: HTMLDialogElement | null = null;
  #cleanup: (() => void) | null = null;
  #dragCleanup: (() => void) | null = null;
  #instanceId = nextId("ds-sheet-dialog");
  #status = new DialogStatus(this, () => this.#panel);

  constructor() {
    super();
    onLocaleChange(this, () => {
      if (!this.#panel) return;
      this.#sync();
      this.#status.relabel();
    });
  }

  connectedCallback() {
    upgradeProperty(this, "open");
    if (!this.#panel) this.#render();
    this.#sync();
  }

  disconnectedCallback() {
    this.#dragCleanup?.();
    this.#cleanup?.();
    this.#dragCleanup = null;
    this.#cleanup = null;
  }

  attributeChangedCallback() {
    if (this.#panel) this.#sync();
  }

  get open() {
    return boolAttr(this, "open");
  }

  set open(value: boolean) {
    this.toggleAttribute("open", value);
  }

  /** Show a notice in the status area and return its id (ADR 0016). */
  notify(options: DialogNoticeOptions): string {
    return this.#status.notify(options);
  }

  /** Remove one notice from the status area. */
  dismissNotice(id: string): void {
    this.#status.dismiss(id);
  }

  /** Remove every notice from the status area. */
  clearNotices(): void {
    this.#status.clear();
  }

  #setOpen = (next: boolean) => {
    if (this.open === next) return;
    this.open = next;
    emit(this, "open-change", { open: next });
  };

  #takeSlot(name: string) {
    const nodes = Array.from(this.children).filter((child) => child.getAttribute("slot") === name);
    for (const node of nodes) node.removeAttribute("slot");
    return nodes;
  }

  #region(className: string, children: Element[]) {
    if (children.length === 0) return null;
    const region = document.createElement("div");
    region.className = className;
    region.append(...children);
    return region;
  }

  #render() {
    const iconContent = this.#takeSlot("icon");
    const headerLeadContent = this.#takeSlot("header-lead");
    const headerActionsContent = this.#takeSlot("header-actions");
    const footerContent = this.#takeSlot("footer");

    const body = document.createElement("div");
    body.className = "sheet-dialog__body";
    while (this.firstChild) body.appendChild(this.firstChild);

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "button";

    const panel = document.createElement("dialog");
    panel.className = "sheet-dialog__panel";

    const handle = document.createElement("div");
    handle.className = "sheet-dialog__handle";
    handle.setAttribute("aria-hidden", "true");
    handle.addEventListener("pointerdown", this.#startDrag);

    const header = createDialogHeader({
      icon: iconContent,
      lead: headerLeadContent,
      actions: headerActionsContent,
    });

    panel.append(handle, header.header, body, ...this.#status.parts);
    const footer = this.#region("sheet-dialog__footer", footerContent);
    if (footer) panel.appendChild(footer);
    this.append(trigger, panel);

    this.#trigger = trigger;
    this.#panel = panel;
    this.header = header;
    this.handle = handle;
  }

  private header!: DialogHeaderParts;
  private handle!: HTMLDivElement;

  #sync() {
    const panel = this.#panel!;
    const describedBy = this.getAttribute("description") != null;
    const api = core.connect({
      state: { open: this.open, id: this.id || this.#instanceId, role: "dialog" },
      setOpen: this.#setOpen,
      describedBy,
    });

    syncDialogHeader(this.header, {
      heading: this.getAttribute("heading") ?? "",
      subtitle: this.getAttribute("description"),
      closeButton: boolAttr(this, "close-button", true),
      closeLabel: localized(this, "close-label", "sheetDialog.close"),
    });
    panel.dataset.side = this.#side();
    this.handle.hidden = !boolAttr(this, "draggable") || this.#side() === "top";

    const renderTrigger = boolAttr(this, "render-trigger", true);
    this.#trigger!.hidden = !renderTrigger;
    this.#trigger!.textContent = localized(this, "trigger", "dialog.trigger");
    this.#trigger!.dataset.variant = this.getAttribute("trigger-variant") ?? "default";

    applyProps(this.#trigger!, api.triggerProps);
    applyProps(panel, api.contentProps);
    applyProps(this.header.heading, api.titleProps);
    if (describedBy) applyProps(this.header.subtitle, api.descriptionProps);
    applyProps(this.header.close, api.closeProps);

    // A disconnected <dialog> cannot be shown; connecting syncs again.
    if (this.open && !this.#cleanup && this.isConnected) this.#show();
    if (!this.open && this.#cleanup) {
      this.#cleanup();
      this.#cleanup = null;
    }
  }

  #show() {
    const closeModal = openModal(this.#panel!, {
      dismiss: () => this.#setOpen(false),
      closesOnOutsidePress: () => !boolAttr(this, "no-outside-close"),
      initialFocus: this.getAttribute("initial-focus"),
      status: this.#status,
      restoreFocus: (previous) => {
        const trigger = this.#trigger!.hidden ? null : this.#trigger;
        returnFocus(trigger ? previous : this.#returnFocusTo(previous), trigger);
      },
    });
    this.#cleanup = () => {
      this.#dragCleanup?.();
      this.#dragCleanup = null;
      closeModal();
    };
  }

  #returnFocusTo(previouslyFocused: HTMLElement | null) {
    const selector = this.getAttribute("return-focus-to");
    if (selector) {
      try {
        return document.querySelector<HTMLElement>(selector) ?? previouslyFocused;
      } catch {
        return previouslyFocused;
      }
    }
    return previouslyFocused;
  }

  #side(): SheetDialogSide {
    const side = this.getAttribute("side");
    return side === "top" || side === "bottom" || side === "left" ? side : "right";
  }

  #startDrag = (event: PointerEvent) => {
    if (this.handle.hidden || (event.pointerType === "mouse" && event.button !== 0)) return;
    const panel = this.#panel!;
    const side = this.#side();
    const startX = event.clientX;
    const startY = event.clientY;
    const extent = side === "bottom" ? panel.offsetHeight : panel.offsetWidth;
    let lastOffset = 0;
    let lastTime = event.timeStamp;
    let velocity = 0;

    const outward = (move: PointerEvent) => {
      if (side === "bottom") return move.clientY - startY;
      if (side === "left") return startX - move.clientX;
      return move.clientX - startX;
    };
    const transform = (offset: number) =>
      side === "bottom"
        ? `translateY(${offset}px)`
        : `translateX(${side === "left" ? -offset : offset}px)`;
    const onMove = (move: PointerEvent) => {
      if (move.pointerId !== event.pointerId) return;
      const offset = Math.max(0, outward(move));
      const elapsed = move.timeStamp - lastTime;
      if (elapsed > 0) velocity = (offset - lastOffset) / elapsed;
      lastOffset = offset;
      lastTime = move.timeStamp;
      panel.style.transform = transform(offset);
    };
    const end = (move: PointerEvent) => {
      if (move.pointerId !== event.pointerId) return;
      this.#dragCleanup?.();
      this.#dragCleanup = null;
      // A cancelled pointer carries no real position: the sheet snaps back.
      if (move.type === "pointercancel") return;
      const offset = Math.max(0, outward(move));
      if ((extent > 0 && offset > extent * 0.25) || velocity > 0.5) this.#setOpen(false);
    };
    this.#dragCleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      panel.classList.remove("sheet-dialog__panel--dragging");
      panel.style.removeProperty("transform");
    };
    panel.classList.add("sheet-dialog__panel--dragging");
    this.handle.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };
}
