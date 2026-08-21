import { menu as core } from "@design-system/core";
import {
  computed,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { onOutsidePointerDown } from "../internal/dismiss";
import { attachFloating } from "../internal/floating";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";

export type MenuItem = core.MenuItem;
export type MenuEntry = core.MenuEntry;
export type MenuGroup = core.MenuGroup;
export type MenuSeparator = core.MenuSeparator;
export type MenuItemKind = core.MenuItemKind;

export interface UseDropdownMenuOptions {
  items: MenuEntry[];
  disabled?: boolean;
  /** Called with the chosen item's value. */
  onSelect?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export interface UseDropdownMenu {
  api: ComputedRef<core.MenuApi>;
  open: ComputedRef<boolean>;
  /** Template ref for the trigger button; the positioning anchor. */
  triggerRef: Ref<HTMLElement | null>;
  /** Template ref for the menu popup (rendered always, hidden while closed). */
  menuRef: Ref<HTMLElement | null>;
}

const TYPEAHEAD_RESET = 500;

// Stable per-instance ids, as in Select: a module counter keeps the Vue peer
// range at ^3.4 (Vue's own `useId` landed in 3.5).
/**
 * Connect the headless menu (WAI-ARIA menu button) to Vue. Behaviour and
 * accessibility live in `@design-system/core` (open/close, arrow & Home/End
 * navigation, selection, Escape/Tab); this composable owns the DOM concerns:
 * popup positioning (`attachFloating`, flip/shift), moving DOM focus into the
 * menu (roving: the active item is focused), returning focus to the trigger on
 * close, typeahead, and close-on-outside-pointer.
 *
 * The popup stays rendered while closed (hidden via `data-state` in CSS) so
 * item nodes keep their identity across open/close and state changes: a
 * pointer press must land on the node it started on.
 */
export function useDropdownMenu(
  options: MaybeRefOrGetter<UseDropdownMenuOptions>,
): UseDropdownMenu {
  const id = useStableId("ds-menu");
  const resolved = computed(() => toValue(options));

  const open = ref(false);
  const activeValue = ref<string | null>(null);

  // Drop a vanished item's highlight when the item list changes.
  watch(
    () => resolved.value.items,
    (items) => {
      const present = core.itemsOf(items).some((item) => item.value === activeValue.value);
      if (!present) activeValue.value = null;
    },
  );

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

  const itemEl = (value: string | null) =>
    value && menuRef.value
      ? menuRef.value.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)
      : null;

  // Typeahead while the menu is open. A native listener on the popup element,
  // so it runs alongside the core's own keydown handling.
  let buffer = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
  const onTypeahead = (event: KeyboardEvent) => {
    if (!open.value) return;
    const printable =
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      /\S/.test(event.key);
    if (!printable) return;
    buffer += event.key;
    clearTimeout(typeaheadTimer);
    typeaheadTimer = setTimeout(() => (buffer = ""), TYPEAHEAD_RESET);
    const match = core.matchItem(resolved.value.items, buffer, activeValue.value);
    if (match) setActiveValue(match);
  };

  watch(menuRef, (node, _previous, onCleanup) => {
    if (!node) return;
    node.addEventListener("keydown", onTypeahead);
    onCleanup(() => {
      node.removeEventListener("keydown", onTypeahead);
      clearTimeout(typeaheadTimer);
    });
  });

  watch(
    open,
    (isOpen, _previous, onCleanup) => {
      if (!isOpen) {
        // Return focus to the trigger when the menu closes.
        triggerRef.value?.focus();
        return;
      }
      const trigger = triggerRef.value;
      const popup = menuRef.value;
      if (!trigger || !popup) return;

      const stopFloating = attachFloating(trigger, popup, { sameWidth: true });
      const stopOutside = onOutsidePointerDown([trigger, popup], () => {
        setOpen(false);
        setActiveValue(null);
      });

      onCleanup(() => {
        stopFloating();
        stopOutside();
      });
    },
    { flush: "post" },
  );

  // Move DOM focus to the active item (roving focus) once the DOM (the
  // popup's display + items) has updated, keeping the menu, not the trigger,
  // the keyboard target.
  watch(
    [open, activeValue],
    () => {
      if (open.value) itemEl(activeValue.value)?.focus();
    },
    { flush: "post" },
  );

  return {
    api,
    open: computed(() => open.value),
    triggerRef,
    menuRef,
  };
}
