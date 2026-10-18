import { navigationMenu as core } from "@invisible-ui/core";
import { tick } from "svelte";
import type { Action } from "svelte/action";
import { derived, get, writable, type Readable } from "svelte/store";
import { createItemAction } from "../internal/connect";
import { onOutsidePointerDown } from "../internal/dismiss";
import { attachFloating, type Placement } from "../internal/floating";
import { stableId } from "../internal/stable-id";
import { normalizeProps } from "../normalize";

export type NavigationMenuApi = core.NavigationMenuApi;
export type NavigationMenuState = core.NavigationMenuState;

/** A link inside a navigation menu panel. */
export interface NavigationMenuLink {
  label: string;
  href: string;
  description?: string;
  /**
   * Marks the link to the page on screen: `aria-current="page"`, and its
   * panel's trigger is styled as holding the current page.
   */
  current?: boolean;
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
  /** For plain link items: marks the link to the page on screen (`aria-current="page"`). */
  current?: boolean;
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

/**
 * What a trigger action takes: the item's value, or the value with
 * `holdsCurrent` when the item's panel holds the current page.
 */
export type NavigationMenuTriggerParam = string | { value: string; holdsCurrent?: boolean };

/** What a link action takes: whether it is the current page, and its panel. */
export interface NavigationMenuLinkParam {
  /** The link goes to the page on screen. */
  current?: boolean;
  /** The value of the panel holding the link; omit for a top-level link. */
  panel?: string;
}

export interface CreateNavigationMenu {
  state: Readable<NavigationMenuState>;
  api: Readable<NavigationMenuApi>;
  /** The open item's value (or `null`). */
  value: Readable<string | null>;
  /**
   * Imperatively set the open value. A panel opened this way stays open
   * until it is closed; pass `kept: false` to let the pointer leaving close it.
   */
  setValue: (value: string | null, kept?: boolean) => void;
  /** Reflect a controlled `value` prop without reporting a change. */
  syncValue: (value: string | null) => void;
  /** Action for a panel item's trigger: `use:triggerAction={value}`. */
  triggerAction: Action<HTMLElement, NavigationMenuTriggerParam>;
  /** Action for a panel item's content (render only while open): `use:contentAction={value}`. */
  contentAction: Action<HTMLElement, string>;
  /** Action for every link, in a panel or at the top level: `use:linkAction={{ current, panel }}`. */
  linkAction: Action<HTMLElement, NavigationMenuLinkParam | undefined>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const triggerValue = (param: NavigationMenuTriggerParam) =>
  typeof param === "string" ? param : param.value;

/**
 * Create a headless navigation menu. ARIA/state live in `@invisible-ui/core`;
 * this adapter owns the DOM concerns, reusing the shared overlay primitives:
 * hover open/close with delays (and immediate switching between panels),
 * `attachFloating` positioning, outside-press dismissal, and focus movement
 * (ArrowDown moves into the panel; Escape returns to the trigger). At most one
 * panel is open.
 *
 * The pointer resting on a trigger opens its panel while it stays; a press
 * keeps a panel open, also one the pointer opened, and a second press closes
 * it. A press, Escape or an outside press cancels any pending hover, so a
 * panel the user just closed never reopens until the pointer enters a
 * trigger again. Activating a link closes the panel before navigation.
 */
export function createNavigationMenu(context: NavigationMenuContext = {}): CreateNavigationMenu {
  const state = writable<NavigationMenuState>(
    core.initialState({ ...context, id: context.id ?? stableId("ds-navigation-menu") }),
  );
  const { placement = "bottom-start", offset = 8, openDelay = 150, closeDelay = 150 } = context;

  // Only a changed value is reported; whether a press keeps it is internal.
  const setValue = (value: string | null, kept: boolean = value !== null) => {
    const current = get(state);
    if (current.value === value && current.kept === kept) return;
    state.set({ ...current, value, kept });
    if (current.value !== value) context.onValueChange?.(value);
  };

  // Reflect a controlled `value` prop without reporting a change. A value set
  // from outside waits for the user to close it, as one open from the start.
  const syncValue = (value: string | null) =>
    state.update((current) =>
      current.value === value ? current : { ...current, value, kept: value !== null },
    );

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
  // The latest API is read when the timer fires: the state may have moved.
  const scheduleClose = () => {
    clearTimers();
    closeTimer = setTimeout(() => get(api).hoverClose(), closeDelay);
  };

  const triggerProps = createItemAction(api, (a, param: NavigationMenuTriggerParam) =>
    typeof param === "string"
      ? a.getTriggerProps(param)
      : a.getTriggerProps(param.value, { holdsCurrent: param.holdsCurrent }),
  );
  const contentProps = createItemAction(api, (a, value: string) => a.getContentProps(value));
  const linkProps = createItemAction(api, (a, param: NavigationMenuLinkParam | undefined) =>
    a.getLinkProps({ current: param?.current }),
  );

  const triggerAction: Action<HTMLElement, NavigationMenuTriggerParam> = (node, initial) => {
    let value = triggerValue(initial);
    triggerEls[value] = node;
    const base = triggerProps(node, initial);

    const onEnter = (event: Event) => {
      // Touch has no hover: a tap fires pointerenter AND click, and the click
      // (core toggle) would immediately close what pointerenter just opened.
      // Let the click own touch so the panel doesn't flash open/closed.
      if ((event as PointerEvent).pointerType === "touch") return;
      clearTimers();
      const open = get(state).value;
      if (open !== null) get(api).hoverOpen(value);
      else openTimer = setTimeout(() => get(api).hoverOpen(value), openDelay);
    };
    const onLeave = () => scheduleClose();
    // The press itself runs through core; a hover still pending must not
    // undo it.
    const onClick = () => clearTimers();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") clearTimers();
      if (event.key !== "ArrowDown") return;
      // ArrowDown (handled by core to open) also moves focus into the panel.
      tick().then(() => {
        contentEls[value]?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      });
    };
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    node.addEventListener("click", onClick);
    node.addEventListener("keydown", onKeyDown);

    return {
      update(next) {
        if (triggerEls[value] === node) delete triggerEls[value];
        value = triggerValue(next);
        triggerEls[value] = node;
        base.update(next);
      },
      destroy() {
        node.removeEventListener("pointerenter", onEnter);
        node.removeEventListener("pointerleave", onLeave);
        node.removeEventListener("click", onClick);
        node.removeEventListener("keydown", onKeyDown);
        if (triggerEls[value] === node) delete triggerEls[value];
        // The timers belong to the menu, not to one trigger: only clear them
        // when the last trigger goes, or dropping one item would cancel a
        // hover the user started on another.
        if (Object.keys(triggerEls).length === 0) clearTimers();
        base.destroy();
      },
    };
  };

  const contentAction: Action<HTMLElement, string> = (node, initial) => {
    let value = initial as string;
    contentEls[value] = node;
    const base = contentProps(node, value);

    // Positioning and outside dismissal follow the trigger of the current item.
    let triggerEl: HTMLElement | null = null;
    let stopFloating = () => {};
    let stopOutside = () => {};
    const attach = () => {
      triggerEl = triggerEls[value] ?? null;
      stopFloating = triggerEl ? attachFloating(triggerEl, node, { placement, offset }) : () => {};
      // An outside press closes without moving focus.
      stopOutside = onOutsidePointerDown([triggerEl, node], () => {
        clearTimers();
        get(api).close();
      });
    };
    attach();

    const onEnter = () => clearTimers();
    const onLeave = () => scheduleClose();
    // Escape (handled by core to close) also returns focus to the trigger.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      clearTimers();
      triggerEl?.focus();
    };
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    node.addEventListener("keydown", onKeyDown);

    return {
      update(next) {
        if (contentEls[value] === node) delete contentEls[value];
        value = next as string;
        contentEls[value] = node;
        base.update(value);
        stopFloating();
        stopOutside();
        attach();
      },
      destroy() {
        stopFloating();
        stopOutside();
        node.removeEventListener("pointerenter", onEnter);
        node.removeEventListener("pointerleave", onLeave);
        node.removeEventListener("keydown", onKeyDown);
        if (contentEls[value] === node) delete contentEls[value];
        base.destroy();
        // A hover delay still pending, such as the one a pointer click
        // starts, must not reopen a panel that has just closed.
        clearTimers();
      },
    };
  };

  const linkAction: Action<HTMLElement, NavigationMenuLinkParam | undefined> = (node, initial) => {
    let param = initial;
    const base = linkProps(node, param);

    // Core closes the panel on click and focus stays where the app puts it.
    // Only when it would be lost (the link went with the panel, and nothing
    // took focus once the page updated) does it go back to the trigger.
    const onClick = () => {
      clearTimers();
      const panel = param?.panel;
      if (panel === undefined) return;
      setTimeout(() => {
        const trigger = triggerEls[panel];
        const active = document.activeElement;
        if (trigger?.isConnected && (!active || active === document.body)) trigger.focus();
      }, 0);
    };
    node.addEventListener("click", onClick);

    return {
      update(next) {
        param = next;
        base.update(next);
      },
      destroy() {
        node.removeEventListener("click", onClick);
        base.destroy();
      },
    };
  };

  return {
    state,
    api,
    value: derived(state, ($state) => $state.value),
    setValue,
    syncValue,
    triggerAction,
    contentAction,
    linkAction,
  };
}
