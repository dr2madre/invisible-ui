import { navigationMenu as core } from "@design-system/core";
import {
  computed,
  nextTick,
  onScopeDispose,
  shallowRef,
  toValue,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  watch,
} from "vue";
import { onOutsidePointerDown } from "../internal/dismiss";
import { attachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

/** A link inside a navigation menu panel. */
export interface NavigationMenuLink {
  label: string;
  href: string;
  description?: string;
  /** Whether the link points to the page on screen. */
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
  /** For plain link items: whether the link points to the page on screen. */
  current?: boolean;
  /** For panel items, the links revealed when opened. */
  links?: NavigationMenuLink[];
}

export interface UseNavigationMenuOptions {
  /** Initial / controlled open value. */
  value?: string | null;
  /** Preferred placement of the panels. Default `"bottom-start"`. */
  placement?: Placement;
  /** Gap between trigger and panel, in px. Default `8`. */
  offset?: number;
  /** Delay before opening on hover, in ms. Default `150`. */
  openDelay?: number;
  /** Delay before closing on leave, in ms. Default `150`. */
  closeDelay?: number;
  onValueChange?: (value: string | null) => void;
}

export interface UseNavigationMenu {
  api: ComputedRef<core.NavigationMenuApi>;
  /** The open item's value, or `null`. */
  value: ComputedRef<string | null>;
  /**
   * Set the open value and whether a press keeps it open; `kept` defaults to
   * `true` for an item and `false` for `null`.
   */
  setValue: (value: string | null, kept?: boolean) => void;
  /** Register a panel item's trigger element, by value. */
  setTriggerRef: (value: string, node: HTMLElement | null) => void;
  /** Template ref for the open panel; at most one is rendered. */
  contentRef: Ref<HTMLElement | null>;
  /** Pointer entered a trigger: open it, or switch immediately while open. */
  onTriggerPointerenter: (value: string, event: PointerEvent) => void;
  /** Pointer left a trigger or the panel: schedule the close. */
  scheduleClose: () => void;
  /** Cancel pending open/close timers (the panel is hoverable). */
  hold: () => void;
  /** ArrowDown on a trigger also moves focus into the panel. */
  onTriggerKeydown: (event: KeyboardEvent) => void;
  /** Escape inside the panel returns focus to its trigger. */
  onContentKeydown: (value: string, event: KeyboardEvent) => void;
  /** A link in the panel of `value` was activated. */
  onLinkClick: (value: string) => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Connect the headless navigation menu to Vue. State and ARIA (the open value,
 * whether a press keeps it open, `aria-expanded` / `aria-controls`,
 * `aria-current`, Escape, ArrowDown) live in `@design-system/core`; this
 * composable owns the DOM concerns through the shared overlay helpers: hover
 * open/close with delays (switching between panels is immediate),
 * `attachFloating` positioning, `onOutsidePointerDown` dismissal, and focus
 * movement (ArrowDown moves into the panel, Escape returns to the trigger). A
 * press, Escape or an outside press cancels any pending hover timer, so a
 * panel the user just closed never reopens by itself. At most one panel is
 * open.
 */
export function useNavigationMenu(
  options: MaybeRefOrGetter<UseNavigationMenuOptions> = {},
): UseNavigationMenu {
  const id = useStableId("ds-navigation-menu");
  const resolved = computed(() => toValue(options));

  const value = shallowRef<string | null>(resolved.value.value ?? null);
  const kept = shallowRef(value.value !== null);

  // Mirror an externally controlled value; one the app opens stays open.
  watch(
    () => resolved.value.value,
    (next) => {
      if (next === undefined) return;
      value.value = next;
      kept.value = next !== null;
    },
  );

  const setValue = (next: string | null, nextKept: boolean = next !== null) => {
    kept.value = nextKept;
    if (value.value === next) return;
    value.value = next;
    resolved.value.onValueChange?.(next);
  };

  const api = computed(() =>
    core.connect({
      state: { value: value.value, kept: kept.value, id },
      setValue,
      normalize: normalizeProps,
    }),
  );

  const triggerEls = new Map<string, HTMLElement>();
  const contentRef = shallowRef<HTMLElement | null>(null);

  const setTriggerRef = (key: string, node: HTMLElement | null) => {
    if (node) triggerEls.set(key, node);
    else triggerEls.delete(key);
  };

  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let focusTimer: ReturnType<typeof setTimeout> | undefined;
  const hold = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  };
  // A pending hover must not open something after the component is gone.
  onScopeDispose(() => {
    hold();
    clearTimeout(focusTimer);
  });
  const scheduleClose = () => {
    hold();
    // The latest api is read when the timer fires; the core ignores a kept panel.
    closeTimer = setTimeout(() => api.value.hoverClose(), resolved.value.closeDelay ?? 150);
  };

  const onTriggerPointerenter = (key: string, event: PointerEvent) => {
    // Touch has no hover: a tap fires pointerenter *and* click, and the click
    // (the core's toggle) would close what pointerenter just opened. The click
    // owns touch, so the panel doesn't flash open and closed.
    if (event.pointerType === "touch") return;
    hold();
    const open = value.value;
    if (open === null) {
      openTimer = setTimeout(() => api.value.hoverOpen(key), resolved.value.openDelay ?? 150);
    } else if (open !== key) {
      api.value.hoverOpen(key);
    }
  };

  const onTriggerKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") hold();
    if (event.key !== "ArrowDown") return;
    void nextTick().then(() => {
      contentRef.value?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
  };

  const onContentKeydown = (key: string, event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    hold();
    triggerEls.get(key)?.focus();
  };

  // The panel closes before navigation and focus stays where the app puts it.
  // Only when it fell to the page once the panel is gone does the trigger take
  // it, so the keyboard keeps a place in the bar.
  const onLinkClick = (key: string) => {
    hold();
    clearTimeout(focusTimer);
    focusTimer = setTimeout(() => {
      const active = document.activeElement;
      const trigger = triggerEls.get(key);
      if ((active === null || active === document.body) && trigger?.isConnected) trigger.focus();
    }, 0);
  };

  // Position and guard the open panel; the cleanup runs when it closes or the
  // open value switches to another item.
  watch(
    value,
    (open, _previous, onCleanup) => {
      if (open === null) return;
      const panel = contentRef.value;
      if (!panel) return;
      const trigger = triggerEls.get(open) ?? null;

      const stopFloating = trigger
        ? attachFloating(trigger, panel, {
            placement: resolved.value.placement ?? "bottom-start",
            offset: resolved.value.offset ?? 8,
          })
        : () => {};
      const stopOutside = onOutsidePointerDown([trigger, panel], () => {
        hold();
        api.value.close();
      });

      onCleanup(() => {
        stopFloating();
        stopOutside();
        hold();
      });
    },
    { flush: "post" },
  );

  return {
    api,
    value: computed(() => value.value),
    setValue,
    setTriggerRef,
    contentRef,
    onTriggerPointerenter,
    scheduleClose,
    hold,
    onTriggerKeydown,
    onContentKeydown,
    onLinkClick,
  };
}
