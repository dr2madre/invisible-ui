import { hoverCard as core } from "@design-system/core";
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useControllable } from "../internal/controllable";
import { useDelayedToggle, type DelayedToggle } from "../internal/delayed-toggle";
import { useAttachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";

export interface UseHoverPreviewOptions {
  /** Initial / controlled open state. */
  open?: boolean;
  /** Preferred placement of the card. Default `"bottom"`. */
  placement?: Placement;
  /** Gap between trigger and card, in px. Default `8`. */
  offset?: number;
  /** Delay before opening on hover, in ms. Default `300`. */
  openDelay?: number;
  /** Delay before closing on leave, in ms. Default `200`. */
  closeDelay?: number;
  onOpenChange?: (open: boolean) => void;
}

export interface UseHoverPreview extends DelayedToggle {
  api: core.HoverCardApi;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Attach to the trigger wrapper; the positioning anchor. */
  triggerRef: RefObject<HTMLElement | null>;
  /** Attach to the card. Render it only while `open`. */
  cardRef: (node: HTMLElement | null) => void;
}

/**
 * The hover and focus preview behind Popover's `trigger="hover"` mode (the
 * pattern other libraries call a hover card). State and ARIA live in
 * `@design-system/core`; this hook owns the DOM side: opening on hover and
 * focus with delays, Floating UI positioning, closing when focus leaves the
 * trigger and the card, and Escape. Focus never moves into the card. The
 * component wires the pointer and focus events to `show`, `hide` and `hold`.
 */
export function useHoverPreview({
  open: openProp = false,
  placement = "bottom",
  offset = 8,
  openDelay = 300,
  closeDelay = 200,
  onOpenChange,
}: UseHoverPreviewOptions = {}): UseHoverPreview {
  const id = `ds-hover-preview-${useId()}`;
  const [open, setOpen] = useControllable(openProp, onOpenChange);
  const api = useMemo(
    () => core.connect({ state: { open, id }, normalize: normalizeProps }),
    [open, id],
  );
  const toggle = useDelayedToggle(setOpen, openDelay, closeDelay);

  const triggerRef = useRef<HTMLElement>(null);
  const [card, cardRef] = useState<HTMLElement | null>(null);

  useAttachFloating(triggerRef, card, placement, offset);

  const { hide } = toggle;
  useEffect(() => {
    if (!card) return;
    const trigger = triggerRef.current;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!card.contains(target) && !trigger?.contains(target)) hide(0);
    };
    // Escape closes; focus that was inside the card goes back to the trigger.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const restore = card.contains(document.activeElement);
      hide(0);
      if (restore && trigger?.isConnected) {
        const focusable = trigger.querySelector<HTMLElement>(
          'a[href], button, input, [tabindex]:not([tabindex="-1"])',
        );
        (focusable ?? trigger).focus();
      }
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [card, hide]);

  return { api, open, setOpen, triggerRef, cardRef, ...toggle };
}
