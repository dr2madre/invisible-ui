import { navigationMenu as core } from "@design-system/core";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createPropsAction } from "../internal/connect";
import { onOutsidePointerDown } from "../internal/dismiss";
import { attachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";

export type NavigationMenuApi = core.NavigationMenuApi;
export type NavigationMenuState = core.NavigationMenuState;

/** A link inside a navigation menu panel. */
export interface NavigationMenuLink {
  label: string;
  href: string;
  description?: string;
}

/**
 * A top-level navigation item: either a plain link (`href`) or a panel item
 * that reveals a list of `links`.
 */
export interface NavigationMenuItem {
  value: string;
  label: string;
  /** For plain link items. */
  href?: string;
  /** For panel items — the links revealed when opened. */
  links?: NavigationMenuLink[];
}

export interface NavigationMenuContext extends core.NavigationMenuContext {
  /** Preferred placement of the panels. Default `"bottom-start"`. */
  placement?: Placement;
  /** Gap between trigger and panel, in px. Default `8`. */
  offset?: number;
  /** Delay before opening on hover, in ms. Default `150`. */
  openDelay?: number;
  /** Delay before closing on leave, in ms. Default `150`. */
  closeDelay?: number;
}

export interface CreateNavigationMenu {
  state: Readable<NavigationMenuState>;
  api: Readable<NavigationMenuApi>;
  /** The open item's value (or `null`). */
  value: Readable<string | null>;
  /** Imperatively set the open value. */
  setValue: (value: string | null) => void;
  /** Action for a panel item's trigger: `use:triggerAction={value}`. */
  triggerAction: Action<HTMLElement, string>;
  /** Action for a panel item's content (render only while open): `use:contentAction={value}`. */
  contentAction: Action<HTMLElement, string>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Create a headless navigation menu. ARIA/state live in `@design-system/core`;
 * this adapter owns the DOM concerns, reusing the shared overlay primitives:
 * hover open/close with delays (and immediate switching between panels),
 * `attachFloating` positioning, outside-press dismissal, and focus movement
 * (ArrowDown moves into the panel; Escape returns to the trigger). At most one
 * panel is open. Plain link items need no wiring.
 */
export function createNavigationMenu(context: NavigationMenuContext = {}): CreateNavigationMenu {
  const state = writable<NavigationMenuState>(core.initialState(context));
  const { placement = "bottom-start", offset = 8, openDelay = 150, closeDelay = 150 } = context;

  const setValue = (value: string | null) =>
    state.update((current) => {
      if (current.value === value) return current;
      context.onValueChange?.(value);
      return { ...current, value };
    });

  const api = derived(state, ($state) =>
    core.connect({ state: $state, setValue, normalize: normalizeProps }),
  );

  const triggerEls: Record<string, HTMLElement> = {};
  const contentEls: Record<string, HTMLElement> = {};
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const clearTimers = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  };
  const scheduleClose = () => {
    clearTimers();
    closeTimer = setTimeout(() => setValue(null), closeDelay);
  };

  const triggerAction: Action<HTMLElement, string> = (node, value) => {
    triggerEls[value as string] = node;
    const base = createPropsAction(
      derived(api, (a) => a.getTriggerProps(value as string)),
      (p) => p,
    )(node);

    const onEnter = () => {
      clearTimers();
      const open = get(state).value;
      if (open !== null && open !== value)
        setValue(value as string); // switch immediately
      else if (open === null) openTimer = setTimeout(() => setValue(value as string), openDelay);
    };
    const onLeave = () => scheduleClose();
    // ArrowDown (handled by core to open) also moves focus into the panel.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown") return;
      tick().then(() => {
        contentEls[value as string]?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      });
    };
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    node.addEventListener("keydown", onKeyDown);

    return {
      destroy() {
        node.removeEventListener("pointerenter", onEnter);
        node.removeEventListener("pointerleave", onLeave);
        node.removeEventListener("keydown", onKeyDown);
        if (triggerEls[value as string] === node) delete triggerEls[value as string];
        base?.destroy?.();
      },
    };
  };

  const contentAction: Action<HTMLElement, string> = (node, value) => {
    contentEls[value as string] = node;
    const base = createPropsAction(
      derived(api, (a) => a.getContentProps(value as string)),
      (p) => p,
    )(node);

    const triggerEl = triggerEls[value as string] ?? null;
    const stopFloating = triggerEl
      ? attachFloating(triggerEl, node, { placement, offset })
      : () => {};
    const stopOutside = onOutsidePointerDown([triggerEl, node], () => setValue(null));

    const onEnter = () => clearTimers();
    const onLeave = () => scheduleClose();
    // Escape (handled by core to close) also returns focus to the trigger.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") triggerEl?.focus();
    };
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    node.addEventListener("keydown", onKeyDown);

    return {
      destroy() {
        stopFloating();
        stopOutside();
        node.removeEventListener("pointerenter", onEnter);
        node.removeEventListener("pointerleave", onLeave);
        node.removeEventListener("keydown", onKeyDown);
        if (contentEls[value as string] === node) delete contentEls[value as string];
        base?.destroy?.();
      },
    };
  };

  return {
    state,
    api,
    value: derived(state, ($state) => $state.value),
    setValue,
    triggerAction,
    contentAction,
  };
}
