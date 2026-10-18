import { navigationMenu as core } from "@invisible-ui/core";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
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
  /** Open an item and keep it open, or close with `null`. */
  setValue: (value: string | null) => void;
  /**
   * Props for a panel item's trigger: the core's, plus hover and focus
   * movement. `holdsCurrent` marks a trigger whose panel links to the page on
   * screen.
   */
  getTriggerProps: (value: string, options?: { holdsCurrent?: boolean }) => Record<string, unknown>;
  /** Props for the open panel: the core's, plus the hover hold and Escape's focus return. */
  getContentProps: (value: string) => Record<string, unknown>;
  /**
   * Props for a link. `current` marks the page on screen; `item` is the panel
   * item the link sits in, left out for a top-level link.
   */
  getLinkProps: (options?: { current?: boolean; item?: string }) => Record<string, unknown>;
  /** Attach to the open panel. */
  contentRef: (node: HTMLElement | null) => void;
}

interface Open {
  value: string | null;
  kept: boolean;
}

const triggerOf = (id: string, value: string) => document.getElementById(core.triggerId(id, value));

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Whether focus has fallen out of the page's controls. */
const focusLost = () => document.activeElement === null || document.activeElement === document.body;

/**
 * Connect the headless Navigation Menu to React. State and ARIA live in
 * `@invisible-ui/core`; this hook owns the DOM side: hover opening after a
 * delay and switching at once while a panel is open, Floating UI
 * positioning, closing on an outside press, ArrowDown moving focus into the
 * panel and Escape returning it to the trigger.
 *
 * A panel the pointer opened closes when the pointer leaves; a click keeps it
 * open until a second click, Escape, an outside press or a link. At most one
 * panel is open; `value` is a controllable mirror (ADR 0011), and a value the
 * page sets is kept open.
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
  const [open, setOpen] = useState<Open>(() => ({ value: valueProp, kept: valueProp !== null }));
  // A changed prop is mirrored while rendering, without a report; an item the
  // page opens waits for the user to close it.
  const [lastProp, setLastProp] = useState(valueProp);
  if (valueProp !== lastProp) {
    setLastProp(valueProp);
    if (valueProp !== open.value) setOpen({ value: valueProp, kept: valueProp !== null });
  }
  const { value, kept } = open;

  const setState = useCallback(
    (next: string | null, nextKept: boolean) => {
      setOpen({ value: next, kept: nextKept });
      if (next !== value) onValueChange?.(next);
    },
    [value, onValueChange],
  );

  const api = useMemo(
    () =>
      core.connect({ state: { value, kept, id }, setValue: setState, normalize: normalizeProps }),
    [value, kept, id, setState],
  );

  // The item a pending hover opens, and the one whose panel takes focus on mount.
  const pending = useRef<string | null>(null);
  const focusOnOpen = useRef<string | null>(null);
  // The api of the last render, read by timers and document listeners so
  // they act on the state of the moment they fire.
  const latest = useRef(api);
  useIsomorphicLayoutEffect(() => {
    latest.current = api;
  });
  const { show, hide, hold } = useDelayedToggle(
    (opening) => {
      if (!opening) latest.current.hoverClose();
      else if (pending.current !== null) latest.current.hoverOpen(pending.current);
    },
    openDelay,
    closeDelay,
  );

  const [content, contentRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const anchor = value === null ? null : triggerOf(id, value);
    if (!content || !anchor || value === null) return;
    const stopFloating = attachFloating(anchor, content, { placement, offset });
    const stopOutside = onOutsidePointerDown(
      () => [anchor, content],
      () => {
        hold();
        latest.current.close();
      },
    );
    if (focusOnOpen.current === value) content.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    focusOnOpen.current = null;
    return () => {
      stopFloating();
      stopOutside();
      // A pending hover must not reopen a panel that has just closed.
      hold();
    };
  }, [content, value, id, placement, offset, hold]);

  const getTriggerProps = (v: string, options?: { holdsCurrent?: boolean }) => {
    const props = api.getTriggerProps(v, options);
    return {
      ...props,
      onPointerEnter: (event: PointerEvent) => {
        // Touch has no hover: the tap toggles, so the panel does not flash.
        if (event.pointerType === "touch") return;
        hold();
        if (value !== null) api.hoverOpen(v);
        else {
          pending.current = v;
          show();
        }
      },
      onPointerLeave: () => hide(),
      onClick: (event: unknown) => {
        // A click decides on its own: no pending hover may undo it.
        hold();
        (props.onClick as Handler)(event);
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "Escape") hold();
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
        if (event.key === "Escape") hold();
        (props.onKeyDown as Handler)(event);
        if (event.key === "Escape") triggerOf(id, v)?.focus();
      },
    };
  };

  const getLinkProps = ({ current, item }: { current?: boolean; item?: string } = {}) => {
    const props = api.getLinkProps({ current });
    return {
      ...props,
      onClick: (event: unknown) => {
        hold();
        (props.onClick as Handler)(event);
        if (item === undefined) return;
        // The panel closes under the focused link. Navigation usually moves
        // focus on; if nothing did by the next task, the trigger takes it so
        // it is not lost.
        const trigger = triggerOf(id, item);
        setTimeout(() => {
          if (trigger?.isConnected && focusLost()) trigger.focus();
        }, 0);
      },
    };
  };

  const setValue = useCallback((next: string | null) => setState(next, next !== null), [setState]);

  return { api, value, setValue, getTriggerProps, getContentProps, getLinkProps, contentRef };
}
