import {
  computed,
  effectScope,
  onScopeDispose,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type EffectScope,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
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
  /** The menus, each ready to render; follows the option list. */
  menus: ComputedRef<MenubarEntry[]>;
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
 * Each menu owns a composable instance, created in its own effect scope the
 * first time that position exists, so adding, removing or reordering top-level
 * menus works without remounting. Scopes for positions the list no longer has
 * are stopped, and all of them stop with the owning scope.
 */
export function useMenubar(options: MaybeRefOrGetter<UseMenubarOptions>): UseMenubar {
  const resolved = computed(() => toValue(options));

  // One dropdown per position, built on demand. A composable cannot be called
  // outside a setup unless it owns a scope, so each instance gets one.
  const dropdowns: UseDropdownMenu[] = [];
  const scopes: EffectScope[] = [];

  const dropdownAt = (index: number): UseDropdownMenu => {
    const existing = dropdowns[index];
    if (existing) return existing;
    const scope = effectScope(true);
    const instance = scope.run(() =>
      useDropdownMenu(() => {
        const current = resolved.value.menus[index];
        return {
          items: current?.items ?? [],
          disabled: current?.disabled,
          onSelect: (itemValue: string) =>
            current && resolved.value.onSelect?.(current.value, itemValue),
        };
      }),
    )!;
    scopes[index] = scope;
    dropdowns[index] = instance;
    return instance;
  };

  const menus = computed(() =>
    resolved.value.menus.map((config, index) => ({ ...config, menu: dropdownAt(index) })),
  );

  // Positions the list dropped keep no live watchers behind them.
  const release = (from: number) => {
    for (let index = from; index < scopes.length; index += 1) {
      scopes[index]?.stop();
      delete scopes[index];
      delete dropdowns[index];
    }
    scopes.length = from;
    dropdowns.length = from;
  };

  const count = () => resolved.value.menus.length;

  watch(count, (total) => release(total));

  onScopeDispose(() => release(0), true);

  const focusedIndex = ref(0);

  const openIndex = () => menus.value.findIndex((entry) => entry.menu.open.value);

  const closeAllExcept = (keep: number) => {
    menus.value.forEach((entry, index) => {
      if (index !== keep && entry.menu.open.value) entry.menu.api.value.closeMenu();
    });
  };

  const openAt = (index: number) => {
    closeAllExcept(index);
    menus.value[index]?.menu.api.value.openMenu("first");
  };

  const focusTrigger = (index: number) => {
    focusedIndex.value = index;
    (menus.value[index]?.menu.triggerRef as Ref<HTMLElement | null> | undefined)?.value?.focus();
  };

  const move = (from: number, direction: 1 | -1) => {
    const total = count();
    if (total === 0) return;
    const next = (from + direction + total) % total;
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
          focusTrigger(count() - 1);
        }
        break;
    }
  };

  return {
    menus,
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
