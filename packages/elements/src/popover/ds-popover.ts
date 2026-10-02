import { button as buttonCore, hoverCard as hoverCore, popover as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  FOCUSABLE,
  HTMLElementBase,
  nextId,
  numberAttr,
  upgradeProperty,
} from "../internal/base";
import { attachFloating, type Placement } from "../internal/floating";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { HoverDelay } from "../internal/hover-delay";
import { onLocaleChange, t } from "../internal/i18n";
import { onOutside } from "../internal/outside";

/**
 * `<ds-popover>` — a non-modal floating card anchored to a trigger. Ported from
 * the Vue adapter, class names kept identical. Two opening contracts, chosen
 * by the `trigger` attribute when the element first renders:
 *
 * - `click` (default): a button opens the card intentionally. The headless
 *   popover (`@design-system/core`) wires `aria-haspopup="dialog"`,
 *   `aria-expanded` and Escape; the card is a `role="dialog"` named by
 *   `label`, or by the trigger. Focus moves into the card when the user opens
 *   it, not when the page sets `open`, and returns to the trigger on Escape.
 *   An outside press, or focus leaving trigger and card, closes it.
 * - `hover`: the card previews on hover and on keyboard focus of the trigger
 *   (typically a link), after `open-delay` and before `close-delay`. Focus
 *   never moves into the card, and the card holds nothing focusable. The first
 *   click or tap opens the preview in place of the trigger's own action; once
 *   open, the action proceeds. Hover content is supplementary: interactive
 *   content belongs to `click`.
 *
 * A child marked `slot="trigger"` is the trigger: the button's content in
 * `click` mode (the catalog's "Open" without one), the focusable element
 * itself in `hover` mode. The other children are the card.
 *
 * Attributes: `trigger` (`click` or `hover`), `trigger-variant`, `open`,
 * `placement` (Floating UI placement, `bottom` by default), `label`,
 * `open-delay` (ms, 300), `close-delay` (ms, 200).
 * Properties: `open` (boolean).
 * Emits: bubbling `open-change` CustomEvent with `detail.open`, when the user
 * opens or closes the card. Setting `open` reports nothing.
 */
export class DsPopover extends HTMLElementBase {
  static observedAttributes = ["open", "label", "trigger-variant", "placement"];

  #id = nextId("ds-popover");
  #hover = false;
  #trigger: HTMLElement | null = null;
  #defaultLabel: HTMLSpanElement | null = null;
  #panel: HTMLDivElement | null = null;
  #cleanup: (() => void) | null = null;
  #stopFloating: (() => void) | null = null;
  #floatingPlacement: Placement | null = null;
  /** Set while the user opens the card, so only that opening moves focus. */
  #userOpening = false;
  /** Set while the user closes the card, which handles focus on its own. */
  #userClosing = false;
  #stopGhost: (() => void) | null = null;
  #delay = new HoverDelay();
  #touch = false;

  constructor() {
    super();
    onLocaleChange(this, () => this.#sync());
  }

  connectedCallback() {
    upgradeProperty(this, "open");
    if (!this.#panel) this.#render();
    if (!this.#hover) this.#stopGhost ??= ignoreGhostClicks(this.#trigger!);
    this.#sync();
  }

  disconnectedCallback() {
    this.#hold();
    this.#stopGhost?.();
    this.#stopGhost = null;
    this.#close();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  get open(): boolean {
    return boolAttr(this, "open");
  }
  set open(value: boolean) {
    this.toggleAttribute("open", value);
  }

  #setOpen = (next: boolean) => {
    if (this.open === next) return;
    this.#userOpening = next;
    this.#userClosing = !next;
    try {
      this.open = next;
    } finally {
      this.#userOpening = false;
      this.#userClosing = false;
    }
    emit(this, "open-change", { open: next });
  };

  #render() {
    this.#hover = this.getAttribute("trigger") === "hover";
    const slotted = Array.from(this.children).filter(
      (child) => child.getAttribute("slot") === "trigger",
    );
    for (const child of slotted) child.removeAttribute("slot");

    const panel = document.createElement("div");
    panel.className = "popover__content";
    while (this.firstChild) {
      const node = this.firstChild;
      if (slotted.includes(node as Element)) node.remove();
      else panel.appendChild(node);
    }

    let trigger: HTMLElement;
    if (this.#hover) {
      // The wrapper carries the hover and focus listeners; the slotted element
      // (typically a link) stays the focusable trigger.
      trigger = document.createElement("span");
      trigger.className = "popover__hover-trigger";
      trigger.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch") this.#show();
      });
      trigger.addEventListener("pointerleave", () => this.#hide());
      trigger.addEventListener("focusin", () => this.#show(0));
      trigger.addEventListener("pointerdown", (event) => {
        this.#touch = event.pointerType !== "mouse";
      });
      trigger.addEventListener("click", this.#onHoverClick);
      panel.addEventListener("pointerenter", () => this.#hold());
      panel.addEventListener("pointerleave", () => this.#hide());
    } else {
      trigger = document.createElement("button");
      trigger.className = "button";
      if (slotted.length === 0) {
        this.#defaultLabel = document.createElement("span");
        trigger.appendChild(this.#defaultLabel);
      }
    }
    trigger.append(...slotted);
    panel.hidden = true;
    this.append(trigger, panel);
    this.#trigger = trigger;
    this.#panel = panel;
  }

  #sync() {
    const trigger = this.#trigger;
    const panel = this.#panel;
    if (!trigger || !panel) return;
    const open = this.open;

    if (this.#hover) {
      const api = hoverCore.connect({ state: { open, id: this.#id } });
      applyProps(trigger, api.triggerProps);
      applyProps(panel, api.contentProps);
    } else {
      if (this.#defaultLabel) this.#defaultLabel.textContent = t(this, "dialog.trigger");
      const variant = (this.getAttribute("trigger-variant") ??
        "default") as buttonCore.ButtonVariant;
      const button = buttonCore.connect({
        state: buttonCore.initialState({ variant }),
        type: "button",
      });
      const api = core.connect({
        state: { open, id: this.#id },
        setOpen: this.#setOpen,
        label: this.getAttribute("label") ?? undefined,
      });
      // The popover's click handler replaces the button's, so it goes last.
      applyProps(trigger, button.rootProps);
      applyProps(trigger, api.triggerProps);
      applyProps(panel, api.contentProps);
    }
    // Closing through `open` would leave focus on a hidden node inside the
    // card; it returns to the trigger.
    const restoreFocus =
      !open && !this.#hover && !this.#userClosing && panel.contains(document.activeElement);
    panel.hidden = !open;

    if (open && this.isConnected) {
      // A placement change while open moves the card at once.
      this.#float();
      this.#cleanup ??= this.#hover ? this.#showHover() : this.#showClick(this.#userOpening);
    } else if (!open) {
      this.#close();
      if (restoreFocus && trigger.isConnected) trigger.focus();
    }
  }

  #float() {
    const placement = this.#placement();
    if (this.#stopFloating && placement === this.#floatingPlacement) return;
    this.#stopFloating?.();
    this.#stopFloating = attachFloating(this.#trigger!, this.#panel!, {
      placement,
      offset: this.#hover ? 8 : 6,
    });
    this.#floatingPlacement = placement;
  }

  #close() {
    this.#stopFloating?.();
    this.#stopFloating = null;
    this.#floatingPlacement = null;
    this.#cleanup?.();
    this.#cleanup = null;
  }

  #placement() {
    return (this.getAttribute("placement") as Placement | null) ?? "bottom";
  }

  #showClick(moveFocus: boolean): () => void {
    const trigger = this.#trigger!;
    const panel = this.#panel!;

    // An outside press or focus leaving both parts closes; focus stays where
    // the user put it.
    const stopOutside = onOutside([panel, trigger], () => this.#setOpen(false), { focus: true });
    // Only a keyboard dismissal sends focus back to the trigger. Capture
    // phase: the flag must be set before the close handler runs.
    let restoreFocus = false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") restoreFocus = true;
    };
    panel.addEventListener("keydown", onKeyDown, true);

    if (moveFocus) (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();

    return () => {
      stopOutside();
      panel.removeEventListener("keydown", onKeyDown, true);
      if (restoreFocus && trigger.isConnected) trigger.focus();
    };
  }

  #showHover(): () => void {
    const trigger = this.#trigger!;
    const panel = this.#panel!;

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!panel.contains(target) && !trigger.contains(target)) this.#hide(0);
    };
    // Escape closes; focus inside the card goes back to the trigger.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const restore = panel.contains(document.activeElement);
      this.#hide(0);
      if (restore && trigger.isConnected) {
        (trigger.querySelector<HTMLElement>(FOCUSABLE) ?? trigger).focus();
      }
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
      this.#hold();
    };
  }

  #hold() {
    this.#delay.cancel();
  }

  #show(delay = numberAttr(this, "open-delay", 300)) {
    this.#delay.run(delay, () => this.#setOpen(true));
  }

  #hide(delay = numberAttr(this, "close-delay", 200)) {
    this.#delay.run(delay, () => this.#setOpen(false));
  }

  // The first activation shows the preview in place of the trigger's own
  // action; once open the action proceeds. A second tap closes, which is the
  // popover contract on touch, where hover does not exist.
  #onHoverClick = (event: MouseEvent) => {
    if (!this.open) {
      event.preventDefault();
      this.#show(0);
    } else if (this.#touch) {
      this.#hide(0);
    }
  };
}
