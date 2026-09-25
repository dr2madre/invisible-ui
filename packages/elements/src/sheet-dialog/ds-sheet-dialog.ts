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
 * Emits: `open-change` with `detail.open`.
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

    panel.append(handle, header.header, body);
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
      closeLabel: this.getAttribute("close-label") ?? "Close",
    });
    panel.dataset.side = this.#side();
    this.handle.hidden = !boolAttr(this, "draggable") || this.#side() === "top";

    const renderTrigger = boolAttr(this, "render-trigger", true);
    this.#trigger!.hidden = !renderTrigger;
    this.#trigger!.textContent = this.getAttribute("trigger") ?? "Open";
    this.#trigger!.dataset.variant = this.getAttribute("trigger-variant") ?? "default";

    applyProps(this.#trigger!, api.triggerProps);
    applyProps(panel, api.contentProps);
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
    panel.showModal();
    const releaseScroll = lockScroll();

    const onCancel = (event: Event) => {
      event.preventDefault();
      this.#setOpen(false);
    };
    const onClose = () => this.#setOpen(false);
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

    const selector = this.getAttribute("initial-focus");
    const target = selector ? panel.querySelector<HTMLElement>(selector) : null;
    (target ?? panel).focus();

    this.#cleanup = () => {
      this.#dragCleanup?.();
      this.#dragCleanup = null;
      panel.removeEventListener("cancel", onCancel);
      panel.removeEventListener("close", onClose);
      panel.removeEventListener("pointerdown", onPointerDown);
      if (panel.open) panel.close();
      releaseScroll();
      const restore = this.#restoreTarget(previouslyFocused);
      if (restore?.isConnected) restore.focus();
    };
  }

  #restoreTarget(previouslyFocused: HTMLElement | null) {
    if (!this.#trigger!.hidden) return this.#trigger;
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
      panel.classList.remove("sheet-dialog__panel--dragging");
      panel.style.removeProperty("transform");
      const offset = Math.max(0, outward(move));
      if ((extent > 0 && offset > extent * 0.25) || velocity > 0.5) this.#setOpen(false);
    };
    this.#dragCleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    panel.classList.add("sheet-dialog__panel--dragging");
    this.handle.setPointerCapture?.(event.pointerId);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };
}
