import { computed, ref, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from "vue";
import {
  useDropdownMenu,
  type MenuItem,
  type UseDropdownMenu,
} from "../dropdown-menu/use-dropdown-menu";

export type { MenuItem };

/** One top-level menu in a menubar. */
export interface MenubarMenu {
  /** Stable value identifying this menu (passed to `onSelect`). */
  value: string;
  /** Visible trigger label. */
  label: string;
  /** The menu's actionable items. */
  items: MenuItem[];
  /** Disable the whole menu. */
  disabled?: boolean;
}

export interface UseMenubarOptions {
  menus: MenubarMenu[];
  /** Called when an item is activated, with its menu and item values. */
  onSelect?: (menuValue: string, itemValue: string) => void;
}

/** A menu wired for rendering: its config plus the connected dropdown driving it. */
export interface MenubarEntry extends MenubarMenu {
  menu: UseDropdownMenu;
}

export interface UseMenubar {
  /** The menus, each ready to render. */
  menus: MenubarEntry[];
  /** Index of the trigger that is the current tab stop (roving tabindex). */
  focusedIndex: ComputedRef<number>;
  /** Record a trigger as focused, keeping the roving tab stop in step. */
  setFocusedIndex: (index: number) => void;
  /** Keydown handler for the bar and for every popup (cross-menu navigation). */
  onMenubarKeydown: (event: KeyboardEvent) => void;
  /** Switch the open menu on hover; a no-op while every menu is closed. */
  onTriggerPointerenter: (index: number) => void;
}

/**
 * Connect a headless menubar (WAI-ARIA menubar pattern) to Vue. Each top-level
 * menu reuses {@link useDropdownMenu} (positioning, roving focus into the menu,
 * typeahead, outside-press close); this composable adds the menubar
 * coordination: a roving tabindex across the triggers, ArrowLeft/Right to move
 * between triggers (or, while a menu is open, to switch the open menu),
 * Home/End, hover-to-switch while open, and one menu open at a time.
 *
 * Each menu owns a composable instance, so the list of menus is read once at
 * setup; their `items` and `disabled` stay reactive.
 */
export function useMenubar(options: MaybeRefOrGetter<UseMenubarOptions>): UseMenubar {
  const resolved = computed(() => toValue(options));
  const configs = resolved.value.menus;
  const count = configs.length;

  const dropdowns = configs.map((config, index) =>
    useDropdownMenu(() => {
      const current = resolved.value.menus[index] ?? config;
      return {
        items: current.items,
        disabled: current.disabled,
        onSelect: (itemValue: string) => resolved.value.onSelect?.(current.value, itemValue),
      };
    }),
  );

  const focusedIndex = ref(0);

  const openIndex = () => dropdowns.findIndex((dropdown) => dropdown.open.value);

  const closeAllExcept = (keep: number) => {
    dropdowns.forEach((dropdown, index) => {
      if (index !== keep && dropdown.open.value) dropdown.api.value.closeMenu();
    });
  };

  const openAt = (index: number) => {
    closeAllExcept(index);
    dropdowns[index]?.api.value.openMenu("first");
  };

  const focusTrigger = (index: number) => {
    focusedIndex.value = index;
    (dropdowns[index]?.triggerRef as Ref<HTMLElement | null> | undefined)?.value?.focus();
  };

  const move = (from: number, direction: 1 | -1) => {
    const next = (from + direction + count) % count;
    focusedIndex.value = next;
    if (openIndex() !== -1) openAt(next);
    else focusTrigger(next);
  };

  const onMenubarKeydown = (event: KeyboardEvent) => {
    const open = openIndex();
    const from = open !== -1 ? open : focusedIndex.value;
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        move(from, 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        move(from, -1);
        break;
      // Home/End move between triggers only while closed; an open menu uses
      // them to jump between its own items.
      case "Home":
        if (open === -1) {
          event.preventDefault();
          focusTrigger(0);
        }
        break;
      case "End":
        if (open === -1) {
          event.preventDefault();
          focusTrigger(count - 1);
        }
        break;
    }
  };

  return {
    menus: configs.map((config, index) => ({ ...config, menu: dropdowns[index]! })),
    focusedIndex: computed(() => focusedIndex.value),
    setFocusedIndex: (index: number) => {
      focusedIndex.value = index;
    },
    onMenubarKeydown,
    onTriggerPointerenter: (index: number) => {
      const open = openIndex();
      if (open !== -1 && open !== index) openAt(index);
    },
  };
}
