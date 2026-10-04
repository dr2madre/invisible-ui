import { useRef, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../button/Button";
import type { ButtonVariant } from "../button/use-button";
import { useI18n } from "../i18n/i18n";
import type { Placement } from "../internal/floating";
import { usePortalHost } from "../internal/portal-host";
import { useHoverPreview } from "./use-hover-preview";
import { usePopover } from "./use-popover";

export interface PopoverProps {
  /** Opening contract: an intentional click, or a hover and focus preview. */
  trigger?: "click" | "hover";
  /** Visual variant for the trigger Button (`trigger="click"` only). */
  triggerVariant?: ButtonVariant;
  /** Initial / controlled open state. */
  open?: boolean;
  /** Preferred placement of the panel. */
  placement?: Placement;
  /** Delay before opening on hover, in ms (`trigger="hover"` only). */
  openDelay?: number;
  /** Delay before closing on leave, in ms (`trigger="hover"` only). */
  closeDelay?: number;
  /** Name for the panel. Defaults to being named by the trigger. */
  label?: string;
  /** Called whenever the user opens or closes the panel. */
  onOpenChange?: (open: boolean) => void;
  /**
   * The trigger button's content (defaults to the catalog's label), or the
   * focusable trigger element itself in hover mode.
   */
  triggerContent?: ReactNode;
  /** The card. */
  children?: ReactNode;
}

type ModeProps = Required<
  Pick<PopoverProps, "triggerVariant" | "open" | "placement" | "openDelay" | "closeDelay">
> &
  Pick<PopoverProps, "label" | "onOpenChange" | "triggerContent" | "children">;

/**
 * Popover: a styled, non-modal floating card anchored to a trigger. Two
 * opening contracts, one component:
 *
 * - **`trigger="click"`** (default): a Button opens it intentionally.
 *   Behaviour and accessibility (`aria-haspopup` and `aria-expanded` wiring,
 *   Escape to close) come from the headless popover (`@design-system/core`);
 *   the adapter adds Floating UI positioning, closing on an outside press or
 *   when focus leaves, and focus management (into the panel on open, back to
 *   the trigger after Escape).
 * - **`trigger="hover"`** (the pattern other libraries call a hover card):
 *   the card previews on hover and keyboard focus of `triggerContent`
 *   (typically a link), with open and close delays; focus never moves into
 *   the card, and the card holds nothing focusable. The first click or tap
 *   opens the preview instead of activating the trigger; once open, the
 *   trigger's own action proceeds, and a second tap closes it. Hover content
 *   is supplementary: essential information and interactive content belong
 *   to `trigger="click"`.
 *
 * Inside an open dialog the card renders in the dialog (ADR 0016). `open` is
 * a controllable mirror (ADR 0011). Themeable via `--ds-popover-*`.
 */
export function Popover({
  trigger = "click",
  triggerVariant = "default",
  open = false,
  placement = "bottom",
  openDelay = 300,
  closeDelay = 200,
  label,
  onOpenChange,
  triggerContent,
  children,
}: PopoverProps) {
  const props = {
    triggerVariant,
    open,
    placement,
    openDelay,
    closeDelay,
    label,
    onOpenChange,
    triggerContent,
    children,
  };
  // The two contracts wire different behaviour to different markup.
  return trigger === "hover" ? <HoverPopover {...props} /> : <ClickPopover {...props} />;
}

function ClickPopover({
  triggerVariant,
  open,
  placement,
  label,
  onOpenChange,
  triggerContent,
  children,
}: ModeProps) {
  const { t, locale, dir } = useI18n();
  const {
    api,
    open: isOpen,
    triggerRef,
    panelRef,
  } = usePopover({
    open,
    placement,
    label,
    onOpenChange,
  });
  const host = usePortalHost(triggerRef);

  return (
    <>
      <Button variant={triggerVariant} {...api.triggerProps} ref={triggerRef}>
        {triggerContent ?? t("dialog.trigger")}
      </Button>
      {isOpen && host
        ? createPortal(
            <div
              {...api.contentProps}
              ref={panelRef}
              className="popover__content"
              lang={locale}
              dir={dir}
            >
              {children}
            </div>,
            host,
          )
        : null}
    </>
  );
}

function HoverPopover({
  open,
  placement,
  openDelay,
  closeDelay,
  onOpenChange,
  triggerContent,
  children,
}: ModeProps) {
  const { locale, dir } = useI18n();
  const {
    api,
    open: isOpen,
    triggerRef,
    cardRef,
    show,
    hide,
    hold,
  } = useHoverPreview({
    open,
    placement,
    openDelay,
    closeDelay,
    onOpenChange,
  });
  const host = usePortalHost(triggerRef);
  // Touch has no hover: the tap owns touch, so the card does not flash.
  const touch = useRef(false);

  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== "touch") show();
  };
  const onPointerDown = (event: PointerEvent) => {
    touch.current = event.pointerType !== "mouse";
  };
  // The first activation shows the preview instead of the trigger's own
  // action; once open the default proceeds (a link navigates), and a second
  // tap closes it: the popover contract where hover does not exist.
  const onClick = (event: MouseEvent) => {
    if (!isOpen) {
      event.preventDefault();
      show(0);
    } else if (touch.current) {
      hide(0);
    }
  };

  return (
    <>
      {/* The wrapper carries the hover and focus listeners; the element passed
          in (typically a link) stays the focusable trigger. */}
      <span
        {...api.triggerProps}
        ref={triggerRef}
        className="popover__hover-trigger"
        onPointerEnter={onPointerEnter}
        onPointerLeave={() => hide()}
        onFocus={() => show(0)}
        onPointerDown={onPointerDown}
        onClick={onClick}
      >
        {triggerContent}
      </span>
      {isOpen && host
        ? createPortal(
            <div
              {...api.contentProps}
              ref={cardRef}
              className="popover__content"
              lang={locale}
              dir={dir}
              onPointerEnter={hold}
              onPointerLeave={() => hide()}
            >
              {children}
            </div>,
            host,
          )
        : null}
    </>
  );
}
