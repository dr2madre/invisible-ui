import { popover as core } from "@design-system/core";
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useControllable } from "../internal/controllable";
import {
  attachFloating,
  ignoreGhostClicks,
  onOutsidePointerDown,
  type Placement,
} from "../internal/floating";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import { normalizeProps } from "../normalize";

export interface UsePopoverOptions {
  /** Initial / controlled open state. */
  open?: boolean;
  /** Preferred placement of the panel. Default `"bottom"`. */
  placement?: Placement;
  /** Gap between trigger and panel, in px. Default `6`. */
  offset?: number;
  /** Name for the panel. Defaults to being named by the trigger. */
  label?: string;
  /**
   * CSS selector for the element that takes focus when the panel opens.
   * Defaults to the first focusable element in the panel, else the panel.
   */
  initialFocus?: string;
  onOpenChange?: (open: boolean) => void;
}

export interface UsePopover<T extends HTMLElement = HTMLButtonElement> {
  api: core.PopoverApi;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Attach to the trigger; the positioning anchor and Escape's focus target. */
  triggerRef: RefObject<T | null>;
  /** Attach to the panel. Render it only while `open`. */
  panelRef: (node: HTMLElement | null) => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Connect the headless Popover to React. Behaviour and ARIA live in
 * `@design-system/core` (open and close, `aria-haspopup` and `aria-expanded`,
 * Escape); this hook owns the DOM side: Floating UI positioning, closing on
 * an outside press or when focus leaves the trigger and the panel, focus
 * moving into the panel on open, and back to the trigger only after Escape.
 * `open` is a controllable mirror (ADR 0011).
 */
export function usePopover<T extends HTMLElement = HTMLButtonElement>({
  open: openProp = false,
  placement = "bottom",
  offset = 6,
  label,
  initialFocus,
  onOpenChange,
}: UsePopoverOptions = {}): UsePopover<T> {
  const id = `ds-popover-${useId()}`;
  const [open, setOpen] = useControllable(openProp, onOpenChange);
  const api = useMemo(
    () => core.connect({ state: { open, id }, setOpen, label, normalize: normalizeProps }),
    [open, id, setOpen, label],
  );

  const triggerRef = useRef<T>(null);
  // The panel in state, so the effects below run when it mounts and unmount.
  const [panel, panelRef] = useState<HTMLElement | null>(null);
  const latest = useRef({ setOpen, initialFocus });
  useIsomorphicLayoutEffect(() => {
    latest.current = { setOpen, initialFocus };
  });

  useEffect(() => {
    const node = triggerRef.current;
    return node ? ignoreGhostClicks(node) : undefined;
  }, []);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!panel || !trigger) return;
    return attachFloating(trigger, panel, { placement, offset });
  }, [panel, placement, offset]);

  useEffect(() => {
    if (!panel) return;
    const trigger = triggerRef.current;
    const close = () => latest.current.setOpen(false);
    const stopOutside = onOutsidePointerDown(() => [trigger, panel], close);
    // Non-modal: focus moving out of the trigger and the panel closes it.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!panel.contains(target) && !trigger?.contains(target)) close();
    };
    document.addEventListener("focusin", onFocusIn);
    // Only a keyboard dismiss sends focus back to the trigger. Capture phase,
    // so the flag is set before the core's handler closes the panel.
    let restore = false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") restore = true;
    };
    panel.addEventListener("keydown", onKeyDown, true);
    (panel.querySelector<HTMLElement>(latest.current.initialFocus ?? FOCUSABLE) ?? panel).focus();
    return () => {
      stopOutside();
      document.removeEventListener("focusin", onFocusIn);
      panel.removeEventListener("keydown", onKeyDown, true);
      if (restore && trigger?.isConnected) trigger.focus();
    };
  }, [panel]);

  return { api, open, setOpen, triggerRef, panelRef };
}
