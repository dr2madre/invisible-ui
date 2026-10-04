import { tooltip as core } from "@design-system/core";
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useDelayedToggle, type DelayedToggle } from "../internal/delayed-toggle";
import { attachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";

export interface UseTooltipOptions {
  /** Preferred placement. Default `"top"`. */
  placement?: Placement;
  /** Gap between trigger and tooltip, in px. Default `6`. */
  offset?: number;
  /** Delay before showing on hover, in ms. Default `300`. */
  openDelay?: number;
  /** Delay before hiding on leave, in ms. Default `100`. */
  closeDelay?: number;
}

export interface UseTooltip extends DelayedToggle {
  api: core.TooltipApi;
  open: boolean;
  /** Attach to the trigger; the positioning anchor. */
  triggerRef: RefObject<HTMLElement | null>;
  /** Attach to the tooltip. Render it only while `open`. */
  tooltipRef: (node: HTMLElement | null) => void;
}

/**
 * Connect the headless Tooltip to React. ARIA lives in `@design-system/core`
 * (`role="tooltip"`, `aria-describedby` while shown); this hook owns the DOM
 * side: open and close delays, Floating UI positioning, and Escape, which
 * hides it even while hovered (WCAG 1.4.13). The component wires hover, focus
 * and tap to `show`, `hide` and `hold`; focus never moves into the tooltip.
 */
export function useTooltip({
  placement = "top",
  offset = 6,
  openDelay = 300,
  closeDelay = 100,
}: UseTooltipOptions = {}): UseTooltip {
  const id = `ds-tooltip-${useId()}`;
  const [open, setOpen] = useState(false);
  const api = useMemo(
    () => core.connect({ state: { open, id }, normalize: normalizeProps }),
    [open, id],
  );
  const toggle = useDelayedToggle(setOpen, openDelay, closeDelay);

  const triggerRef = useRef<HTMLElement>(null);
  const [tooltip, tooltipRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!tooltip || !trigger) return;
    return attachFloating(trigger, tooltip, { placement, offset });
  }, [tooltip, placement, offset]);

  const { hide } = toggle;
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide(0);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, hide]);

  return { api, open, triggerRef, tooltipRef, ...toggle };
}
