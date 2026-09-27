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
  dropdownMenuWithId,
  type MenuItem,
  type UseDropdownMenu,
} from "../dropdown-menu/use-dropdown-menu";
import { useStableId } from "../internal/use-stable-id";

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
 * Each menu owns a composable instance, keyed by its `value` and created in
 * its own effect scope, so adding, removing or reordering top-level menus
 * works without remounting and a menu keeps its state (open, active item)
 * wherever it moves, in step with the DOM, which is keyed by value too.
 * Scopes for menus the list no longer has are stopped, and all of them stop
 * with the owning scope.
 */
export function useMenubar(options: MaybeRefOrGetter<UseMenubarOptions>): UseMenubar {
  const resolved = computed(() => toValue(options));

  // Menus can arrive after setup, where no component instance is there to
  // hand out ids, so the bar takes one stable id now and numbers its menus
  // from it in creation order, the same on the server and in the browser.
  const baseId = useStableId("ds-menubar");
  let created = 0;

  // One dropdown per menu value. A composable cannot run outside a setup
  // unless it owns a scope, so each instance gets one.
  const dropdowns = new Map<string, { scope: EffectScope; menu: UseDropdownMenu }>();

  const dropdownFor = (value: string): UseDropdownMenu => {
    const existing = dropdowns.get(value);
    if (existing) return existing.menu;
    const scope = effectScope(true);
    const menu = scope.run(() =>
      dropdownMenuWithId(`${baseId}-menu-${++created}`, () => {
        const current = resolved.value.menus.find((candidate) => candidate.value === value);
        return {
          items: current?.items ?? [],
          disabled: current?.disabled,
          onSelect: (itemValue: string) => resolved.value.onSelect?.(value, itemValue),
        };
      }),
    )!;
    dropdowns.set(value, { scope, menu });
    return menu;
  };

  const menus = computed(() =>
    resolved.value.menus.map((config) => ({ ...config, menu: dropdownFor(config.value) })),
  );

  const count = () => resolved.value.menus.length;

  const focusedIndex = ref(0);

  // Build the dropdowns of the current list (in setup, the first time), stop
  // the ones whose menu left it, and keep the tab stop on a trigger that
  // still exists.
  watch(
    () => resolved.value.menus.map((menu) => menu.value),
    (values) => {
      values.forEach(dropdownFor);
      for (const [value, entry] of dropdowns) {
        if (values.includes(value)) continue;
        entry.scope.stop();
        dropdowns.delete(value);
      }
      if (focusedIndex.value >= values.length) {
        focusedIndex.value = Math.max(0, values.length - 1);
      }
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    for (const entry of dropdowns.values()) entry.scope.stop();
    dropdowns.clear();
  }, true);

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
