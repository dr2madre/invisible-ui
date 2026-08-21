import { menu as core } from "@design-system/core";
import { computePosition, flip, offset, shift, type Placement } from "@floating-ui/dom";
import {
  computed,
  nextTick,
  onScopeDispose,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type MenuItem = core.MenuItem;

export interface UseContextMenuOptions {
  items: MenuItem[];
  disabled?: boolean;
  /** Called with the chosen item's value. */
  onSelect?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  /** Preferred placement relative to the pointer. Default `"right-start"`. */
  placement?: Placement;
}

/**
 * Listeners to bind on the region that summons the menu: right-click and the
 * keyboard menu key through `contextmenu`, a long press through the pointer
 * events.
 */
export interface ContextMenuTriggerHandlers {
  onContextmenu: (event: MouseEvent) => void;
  onPointerdown: (event: PointerEvent) => void;
  onPointerup: () => void;
  onPointercancel: () => void;
  onPointermove: (event: PointerEvent) => void;
}

export interface UseContextMenu {
  api: ComputedRef<core.MenuApi>;
  open: ComputedRef<boolean>;
  /** Template ref for the region that summons the menu. */
  triggerRef: Ref<HTMLElement | null>;
  /** Template ref for the popup. Render it only while `open`. */
  menuRef: Ref<HTMLElement | null>;
  /** Listeners for the trigger region; spread them onto its element. */
  triggerHandlers: ContextMenuTriggerHandlers;
  /** Open (or re-summon) the menu at a viewport point. */
  openAt: (x: number, y: number) => void;
}

const TYPEAHEAD_RESET = 500;
const LONG_PRESS = 500;
const MOVE_TOLERANCE = 10;

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * Connect a headless context menu to Vue: a `role="menu"` summoned by
 * right-click, by the keyboard context-menu key, or by a long press on touch.
 * It reuses the same `menu` primitive as DropdownMenu for behaviour and ARIA
 * (roving focus, arrow / Home / End navigation, Enter and click activation,
 * Escape and Tab to close); this composable owns the DOM concerns specific to a
 * context menu: positioning the popup against a zero-size virtual anchor at the
 * pointer (`@floating-ui/dom`, flip/shift), close-on-outside-pointer,
 * typeahead, and restoring focus when the menu goes away.
 *
 * There is no trigger button, so the popup carries an `aria-label` supplied by
 * the styled layer; the core's `aria-labelledby` is dropped because no trigger
 * element exists to point at.
 */
export function useContextMenu(options: MaybeRefOrGetter<UseContextMenuOptions>): UseContextMenu {
  const id = useStableId("ds-context-menu");
  const resolved = computed(() => toValue(options));

  const open = ref(false);
  const activeValue = ref<string | null>(null);

  const setOpen = (next: boolean) => {
    if (open.value === next) return;
    open.value = next;
    resolved.value.onOpenChange?.(next);
  };

  const setActiveValue = (next: string | null) => {
    activeValue.value = next;
  };

  const api = computed(() =>
    core.connect({
      state: {
        open: open.value,
        activeValue: activeValue.value,
        items: resolved.value.items,
        disabled: resolved.value.disabled ?? false,
        id,
      },
      setOpen,
      setActiveValue,
      onSelect: (value: string) => resolved.value.onSelect?.(value),
      normalize: normalizeProps,
    }),
  );

  const triggerRef = ref<HTMLElement | null>(null);
  const menuRef = ref<HTMLElement | null>(null);

  // Viewport coordinates of the last open request: the pointer, or the
  // trigger's top-left when the menu is summoned from the keyboard.
  let point = { x: 0, y: 0 };
  // Where focus sat before the menu opened, so it can be handed back.
  let previouslyFocused: HTMLElement | null = null;

  const reposition = () => {
    const popup = menuRef.value;
    if (!popup) return;
    const anchor = {
      getBoundingClientRect: () => ({
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        top: point.y,
        left: point.x,
        right: point.x,
        bottom: point.y,
      }),
    };
    void computePosition(anchor, popup, {
      placement: resolved.value.placement ?? "right-start",
      strategy: "fixed",
      middleware: [offset(2), flip({ padding: 8 }), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      if (!menuRef.value) return;
      menuRef.value.style.left = `${x}px`;
      menuRef.value.style.top = `${y}px`;
    });
  };

  const itemEl = (value: string | null) =>
    value && menuRef.value
      ? menuRef.value.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
      : null;

  const openAt = (x: number, y: number) => {
    if (resolved.value.disabled) return;
    point = { x, y };
    setActiveValue(core.firstEnabled(resolved.value.items));
    if (open.value) {
      reposition();
      return;
    }
    previouslyFocused = document.activeElement as HTMLElement | null;
    setOpen(true);
  };

  // Right-click, the keyboard menu key (which fires `contextmenu` with no
  // pointer), and a long press on touch all summon the menu.
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let pressStart = { x: 0, y: 0 };
  const cancelPress = () => clearTimeout(pressTimer);
  onScopeDispose(cancelPress);

  const triggerHandlers: ContextMenuTriggerHandlers = {
    onContextmenu: (event: MouseEvent) => {
      event.preventDefault();
      if (event.clientX === 0 && event.clientY === 0) {
        const rect = triggerRef.value?.getBoundingClientRect();
        openAt(rect?.left ?? 0, rect?.top ?? 0);
      } else {
        openAt(event.clientX, event.clientY);
      }
    },
    onPointerdown: (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      pressStart = { x: event.clientX, y: event.clientY };
      pressTimer = setTimeout(() => openAt(event.clientX, event.clientY), LONG_PRESS);
    },
    onPointerup: cancelPress,
    onPointercancel: cancelPress,
    onPointermove: (event: PointerEvent) => {
      if (
        Math.abs(event.clientX - pressStart.x) > MOVE_TOLERANCE ||
        Math.abs(event.clientY - pressStart.y) > MOVE_TOLERANCE
      )
        cancelPress();
    },
  };

  // The popup exists only while open, so this post-flush watch tracks the open
  // state: setup runs once the popup is in the DOM, cleanup when it goes away.
  watch(
    open,
    (isOpen, _previous, onCleanup) => {
      if (!isOpen) {
        // Hand focus back to wherever it was before the menu opened.
        if (previouslyFocused?.isConnected) previouslyFocused.focus();
        previouslyFocused = null;
        return;
      }
      const popup = menuRef.value;
      if (!popup) return;

      // The anchor is a fixed viewport point, so one positioning pass is
      // enough: the menu closes on scroll and on an outside press.
      reposition();

      let buffer = "";
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onKeyDown = (event: KeyboardEvent) => {
        const printable =
          event.key.length === 1 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          /\S/.test(event.key);
        if (!printable) return;
        buffer += event.key;
        clearTimeout(timer);
        timer = setTimeout(() => (buffer = ""), TYPEAHEAD_RESET);
        const match = core.matchItem(resolved.value.items, buffer, activeValue.value);
        if (match) setActiveValue(match);
      };
      popup.addEventListener("keydown", onKeyDown);

      const onOutsidePointer = (event: Event) => {
        if (menuRef.value?.contains(event.target as Node)) return;
        setOpen(false);
        setActiveValue(null);
      };
      document.addEventListener("pointerdown", onOutsidePointer, true);

      // Scrolling inside the menu itself is fine; scrolling the page under it
      // is not, because the menu is anchored to a point that has just moved.
      const onScroll = (event: Event) => {
        const target = event.target;
        if (menuRef.value && target instanceof Node && menuRef.value.contains(target)) return;
        setOpen(false);
        setActiveValue(null);
      };
      window.addEventListener("scroll", onScroll, true);

      onCleanup(() => {
        popup.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("pointerdown", onOutsidePointer, true);
        window.removeEventListener("scroll", onScroll, true);
        clearTimeout(timer);
      });
    },
    { flush: "post" },
  );

  // Move DOM focus to the active item (roving) once the popup and its items
  // have been patched into the DOM.
  watch(
    [open, activeValue],
    () => {
      if (!open.value) return;
      const target = activeValue.value;
      void nextTick().then(() => itemEl(target)?.focus());
    },
    { flush: "post" },
  );

  return {
    api,
    open: computed(() => open.value),
    triggerRef,
    menuRef,
    triggerHandlers,
    openAt,
  };
}
