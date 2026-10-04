import { navigationMenu as core } from "@design-system/core";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useControllable } from "../internal/controllable";
import { useDelayedToggle } from "../internal/delayed-toggle";
import { attachFloating, onOutsidePointerDown, type Placement } from "../internal/floating";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";
import { normalizeProps } from "../normalize";

export interface UseNavigationMenuOptions {
  /** The open item's value, or `null`; initial / controlled. */
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Preferred placement of the panels. Default `"bottom-start"`. */
  placement?: Placement;
  /** Gap between trigger and panel, in px. Default `8`. */
  offset?: number;
  /** Delay before opening on hover, in ms. Default `150`. */
  openDelay?: number;
  /** Delay before closing on leave, in ms. Default `150`. */
  closeDelay?: number;
}

type Handler = (event: unknown) => void;

export interface UseNavigationMenu {
  api: core.NavigationMenuApi;
  /** The open item's value, or `null`. */
  value: string | null;
  setValue: (value: string | null) => void;
  /** Props for a panel item's trigger: the core's, plus hover and focus movement. */
  getTriggerProps: (value: string) => Record<string, unknown>;
  /** Props for the open panel: the core's, plus the hover hold and Escape's focus return. */
  getContentProps: (value: string) => Record<string, unknown>;
  /** Attach to the open panel. */
  contentRef: (node: HTMLElement | null) => void;
}

const triggerOf = (id: string, value: string) => document.getElementById(core.triggerId(id, value));

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Connect the headless Navigation Menu to React. State and ARIA live in
 * `@design-system/core`; this hook owns the DOM side: opening on hover after
 * a delay and switching at once while a panel is open, Floating UI
 * positioning, closing on an outside press, ArrowDown moving focus into the
 * panel and Escape returning it to the trigger. At most one panel is open;
 * `value` is a controllable mirror (ADR 0011).
 */
export function useNavigationMenu({
  value: valueProp = null,
  onValueChange,
  placement = "bottom-start",
  offset = 8,
  openDelay = 150,
  closeDelay = 150,
}: UseNavigationMenuOptions = {}): UseNavigationMenu {
  const id = `ds-navigation-menu-${useId()}`;
  const [value, setValue] = useControllable<string | null>(valueProp, onValueChange);
  const api = useMemo(
    () => core.connect({ state: { value, id }, setValue, normalize: normalizeProps }),
    [value, id, setValue],
  );

  // The item a pending hover opens, and the one whose panel takes focus on mount.
  const pending = useRef<string | null>(null);
  const focusOnOpen = useRef<string | null>(null);
  const { show, hide, hold } = useDelayedToggle(
    (open) => setValue(open ? pending.current : null),
    openDelay,
    closeDelay,
  );

  const [content, contentRef] = useState<HTMLElement | null>(null);
  const latest = useRef({ setValue, hold });
  useIsomorphicLayoutEffect(() => {
    latest.current = { setValue, hold };
  });

  useEffect(() => {
    const anchor = value === null ? null : triggerOf(id, value);
    if (!content || !anchor || value === null) return;
    const stopFloating = attachFloating(anchor, content, { placement, offset });
    const stopOutside = onOutsidePointerDown(
      () => [anchor, content],
      () => latest.current.setValue(null),
    );
    if (focusOnOpen.current === value) content.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    focusOnOpen.current = null;
    return () => {
      stopFloating();
      stopOutside();
      // A pending hover must not reopen a panel that has just closed.
      latest.current.hold();
    };
  }, [content, value, id, placement, offset]);

  const getTriggerProps = (v: string) => {
    const props = api.getTriggerProps(v);
    return {
      ...props,
      onPointerEnter: (event: PointerEvent) => {
        // Touch has no hover: the tap toggles, so the panel does not flash.
        if (event.pointerType === "touch") return;
        hold();
        if (value !== null && value !== v) setValue(v);
        else if (value === null) {
          pending.current = v;
          show();
        }
      },
      onPointerLeave: () => hide(),
      onClick: (event: unknown) => {
        hold();
        (props.onClick as Handler)(event);
      },
      onKeyDown: (event: KeyboardEvent) => {
        (props.onKeyDown as Handler)(event);
        if (event.key !== "ArrowDown") return;
        // The core opens the panel; focus goes into it once it is there.
        if (value === v) content?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
        else focusOnOpen.current = v;
      },
    };
  };

  const getContentProps = (v: string) => {
    const props = api.getContentProps(v);
    return {
      ...props,
      onPointerEnter: () => hold(),
      onPointerLeave: () => hide(),
      onKeyDown: (event: KeyboardEvent) => {
        (props.onKeyDown as Handler)(event);
        if (event.key === "Escape") triggerOf(id, v)?.focus();
      },
    };
  };

  return { api, value, setValue, getTriggerProps, getContentProps, contentRef };
}
