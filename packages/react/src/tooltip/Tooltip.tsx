import { useRef, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/i18n";
import type { Placement } from "../internal/floating";
import { usePortalHost } from "../internal/portal-host";
import { useTooltip } from "./use-tooltip";

export interface TooltipProps {
  /** Tooltip label text. */
  text: string;
  /** Preferred placement; flips when there is no room. */
  placement?: Placement;
  /** Delay before showing on hover, in ms. */
  openDelay?: number;
  /** Delay before hiding on leave, in ms. */
  closeDelay?: number;
  /** The trigger: wrap a focusable element. */
  children?: ReactNode;
}

/**
 * Tooltip: a styled descriptive label shown on hover and focus of a trigger
 * (WAI-ARIA `role="tooltip"`, linked by `aria-describedby`). Behaviour comes
 * from the headless tooltip (`@design-system/core`); the adapter adds open
 * and close delays, Floating UI positioning, and WCAG 1.4.13 content on
 * hover: the tooltip stays open while hovered and Escape hides it. Keyboard
 * focus shows it at once. On touch, where hover does not exist, a tap toggles
 * it. Inside an open dialog it renders in the dialog (ADR 0016).
 *
 * `children` is the trigger; `text` is the label. For `aria-describedby` on
 * your own element, use `useTooltip`. Themeable via `--ds-tooltip-*`.
 */
export function Tooltip({
  text,
  placement = "top",
  openDelay = 300,
  closeDelay = 100,
  children,
}: TooltipProps) {
  const { locale, dir } = useI18n();
  const { api, open, triggerRef, tooltipRef, show, hide, hold } = useTooltip({
    placement,
    openDelay,
    closeDelay,
  });
  const host = usePortalHost(triggerRef);
  // Touch has no hover: the tap owns touch, so the tooltip does not flash.
  const touch = useRef(false);

  return (
    <>
      <span
        {...api.triggerProps}
        ref={triggerRef}
        className="tooltip__trigger"
        onPointerEnter={(event: PointerEvent) => {
          if (event.pointerType !== "touch") show();
        }}
        onPointerLeave={() => hide()}
        onFocus={() => show(0)}
        onBlur={() => hide(0)}
        onPointerDown={(event: PointerEvent) => {
          touch.current = event.pointerType !== "mouse";
        }}
        onClick={() => {
          if (!touch.current) return;
          if (open) hide(0);
          else show(0);
        }}
      >
        {children}
      </span>
      {open && host
        ? createPortal(
            <div
              {...api.tooltipProps}
              ref={tooltipRef}
              className="tooltip__content"
              lang={locale}
              dir={dir}
              onPointerEnter={hold}
              onPointerLeave={() => hide()}
            >
              {text}
            </div>,
            host,
          )
        : null}
    </>
  );
}
