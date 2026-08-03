import { navigationMenu as core } from "@design-system/core";
import {
  computed,
  nextTick,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { onOutsidePointerDown } from "../internal/dismiss";
import { attachFloating, type Placement } from "../internal/floating";
import { normalizeProps } from "../normalize";

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
  /** Set the open value. */
  setValue: (value: string | null) => void;
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
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
let instanceCount = 0;

/**
 * Connect the headless navigation menu to Vue. State and ARIA (the open value,
 * `aria-expanded` / `aria-controls`, Escape, ArrowDown) live in
 * `@design-system/core`; this composable owns the DOM concerns through the
 * shared overlay helpers: hover open/close with delays (switching between
 * panels is immediate), `attachFloating` positioning, `onOutsidePointerDown`
 * dismissal, and focus movement (ArrowDown moves into the panel, Escape
 * returns to the trigger). At most one panel is open; plain link items need no
 * wiring.
 */
export function useNavigationMenu(
  options: MaybeRefOrGetter<UseNavigationMenuOptions> = {},
): UseNavigationMenu {
  const id = `ds-navigation-menu-${++instanceCount}`;
  const resolved = computed(() => toValue(options));

  const value = ref<string | null>(resolved.value.value ?? null);

  // Mirror an externally controlled value.
  watch(
    () => resolved.value.value,
    (next) => {
      if (next !== undefined) value.value = next;
    },
  );

  const setValue = (next: string | null) => {
    if (value.value === next) return;
    value.value = next;
    resolved.value.onValueChange?.(next);
  };

  const api = computed(() =>
    core.connect({ state: { value: value.value, id }, setValue, normalize: normalizeProps }),
  );

  const triggerEls = new Map<string, HTMLElement>();
  const contentRef = ref<HTMLElement | null>(null);

  const setTriggerRef = (key: string, node: HTMLElement | null) => {
    if (node) triggerEls.set(key, node);
    else triggerEls.delete(key);
  };

  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const hold = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  };
  const scheduleClose = () => {
    hold();
    closeTimer = setTimeout(() => setValue(null), resolved.value.closeDelay ?? 150);
  };

  const onTriggerPointerenter = (key: string, event: PointerEvent) => {
    // Touch has no hover: a tap fires pointerenter *and* click, and the click
    // (the core's toggle) would close what pointerenter just opened. The click
    // owns touch, so the panel doesn't flash open and closed.
    if (event.pointerType === "touch") return;
    hold();
    const open = value.value;
    if (open !== null && open !== key) setValue(key);
    else if (open === null)
      openTimer = setTimeout(() => setValue(key), resolved.value.openDelay ?? 150);
  };

  const onTriggerKeydown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowDown") return;
    void nextTick().then(() => {
      contentRef.value?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
  };

  const onContentKeydown = (key: string, event: KeyboardEvent) => {
    if (event.key === "Escape") triggerEls.get(key)?.focus();
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
      const stopOutside = onOutsidePointerDown([trigger, panel], () => setValue(null));

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
  };
}
