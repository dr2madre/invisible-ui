import { button as buttonCore, hoverCard as hoverCore, popover as core } from "@design-system/core";
import {
  applyProps,
  boolAttr,
  emit,
  HTMLElementBase,
  nextId,
  upgradeProperty,
} from "../internal/base";
import { attachFloating, type Placement } from "../internal/floating";
import { ignoreGhostClicks } from "../internal/ghost-click";
import { onLocaleChange, t } from "../internal/i18n";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const numberAttr = (element: Element, name: string, fallback: number) => {
  const value = Number(element.getAttribute(name));
  return element.hasAttribute(name) && Number.isFinite(value) ? value : fallback;
};

/**
 * `<ds-popover>` — a non-modal floating card anchored to a trigger. Ported from
 * the Vue adapter, class names kept identical. Two opening contracts, chosen
 * by the `trigger` attribute when the element first renders:
 *
 * - `click` (default): a button opens the card intentionally. The headless
 *   popover (`@design-system/core`) wires `aria-haspopup="dialog"`,
 *   `aria-expanded` and Escape; the card is a `role="dialog"` named by
 *   `label`, or by the trigger. Focus moves into the card on open and returns
 *   to the trigger on Escape. An outside press, or focus leaving trigger and
 *   card, closes it.
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
  #stopGhost: (() => void) | null = null;
  #showTimer: ReturnType<typeof setTimeout> | undefined;
  #hideTimer: ReturnType<typeof setTimeout> | undefined;
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
    this.#cleanup?.();
    this.#cleanup = null;
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
    this.open = next;
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
    panel.hidden = !open;

    if (open && !this.#cleanup && this.isConnected) {
      this.#cleanup = this.#hover ? this.#showHover() : this.#showClick();
    } else if (!open && this.#cleanup) {
      this.#cleanup();
      this.#cleanup = null;
    }
  }

  #placement() {
    return (this.getAttribute("placement") as Placement | null) ?? "bottom";
  }

  #showClick(): () => void {
    const trigger = this.#trigger!;
    const panel = this.#panel!;
    const stopFloating = attachFloating(trigger, panel, {
      placement: this.#placement(),
      offset: 6,
    });

    const outside = (target: Node) => !panel.contains(target) && !trigger.contains(target);
    // An outside press or focus leaving both parts closes; focus stays where
    // the user put it.
    const onPointerDown = (event: Event) => {
      if (outside(event.target as Node)) this.#setOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (outside(event.target as Node)) this.#setOpen(false);
    };
    // Only a keyboard dismissal sends focus back to the trigger. Capture
    // phase: the flag must be set before the close handler runs.
    let restoreFocus = false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") restoreFocus = true;
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn);
    panel.addEventListener("keydown", onKeyDown, true);

    (panel.querySelector<HTMLElement>(FOCUSABLE) ?? panel).focus();

    return () => {
      stopFloating();
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn);
      panel.removeEventListener("keydown", onKeyDown, true);
      if (restoreFocus && trigger.isConnected) trigger.focus();
    };
  }

  #showHover(): () => void {
    const trigger = this.#trigger!;
    const panel = this.#panel!;
    const stopFloating = attachFloating(trigger, panel, {
      placement: this.#placement(),
      offset: 8,
    });

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
      stopFloating();
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
      this.#hold();
    };
  }

  #hold() {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
  }

  #show(delay = numberAttr(this, "open-delay", 300)) {
    this.#hold();
    if (delay <= 0) this.#setOpen(true);
    else this.#showTimer = setTimeout(() => this.#setOpen(true), delay);
  }

  #hide(delay = numberAttr(this, "close-delay", 200)) {
    this.#hold();
    if (delay <= 0) this.#setOpen(false);
    else this.#hideTimer = setTimeout(() => this.#setOpen(false), delay);
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
