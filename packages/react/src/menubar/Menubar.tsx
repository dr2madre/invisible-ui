import { menu as core, menubar as bar } from "@design-system/core";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type { MenuEntry } from "../dropdown-menu/DropdownMenu";
import { useI18n } from "../i18n/i18n";
import { attachFloating } from "../internal/floating";
import { MenuPopup } from "../internal/menu";
import { usePortalHost } from "../internal/portal-host";
import { normalizeProps } from "../normalize";

/** One top-level menu in a menubar. */
export interface MenubarMenu {
  /** Stable value identifying the menu, passed to `onSelect`. */
  value: string;
  /** Visible trigger label. */
  label: string;
  /** Items, separators, groups and submenus, in the order shown. */
  items: MenuEntry[];
  /** A disabled menu takes focus on its trigger but never opens. */
  disabled?: boolean;
}

export interface MenubarProps {
  /** Accessible name for the menubar. */
  label: string;
  /** The top-level menus. */
  menus: MenubarMenu[];
  /** Called with the chosen item's menu value and item value, after the menu has closed. */
  onSelect?: (menuValue: string, itemValue: string) => void;
}

// Menus are tracked by value, so a reorder keeps each state with its menu.
interface BarState {
  focusedValue: string | null;
  openValue: string | null;
  activeValue: string | null;
  openPath: string[];
}

const ALL_CLOSED = { openValue: null, activeValue: null, openPath: [] };
const INITIAL: BarState = { focusedValue: null, ...ALL_CLOSED };

/**
 * Menubar: a horizontal bar of menus (WAI-ARIA menubar pattern), like an
 * application menu (File, Edit, View). Each top menu is a headless menu
 * (`@design-system/core`) with groups, separators, checkable items and
 * submenus (`docs/menu-submenu-spec.md`); the core `menubar` module adds the
 * roving tab stop across the triggers, one open menu at a time, and the left
 * and right arrows: into a submenu on a submenu trigger, to the next top menu
 * anywhere else, mirrored in right-to-left text. Hovering another trigger
 * while a menu is open switches to it.
 *
 * Themeable via `--ds-menu-*` (shared with Dropdown Menu) and
 * `--ds-menubar-*`.
 */
export function Menubar({ label, menus, onSelect }: MenubarProps) {
  const { locale, dir } = useI18n();
  const id = `ds-menubar-${useId()}`;
  const [state, setState] = useState<BarState>(INITIAL);
  const barRef = useRef<HTMLDivElement>(null);
  const host = usePortalHost(barRef);
  const menuId = useCallback((index: number) => `${id}-menu-${index}`, [id]);
  const triggerOf = useCallback(
    (index: number) => document.getElementById(core.triggerId(menuId(index))),
    [menuId],
  );
  const focusTrigger = useCallback((index: number) => triggerOf(index)?.focus(), [triggerOf]);

  const openIndex = menus.findIndex((menu) => menu.value === state.openValue);
  const focusedIndex = Math.max(
    0,
    menus.findIndex((menu) => menu.value === state.focusedValue),
  );
  // The open menu went away, or turned off: every menu is closed.
  if (state.openValue !== null && (openIndex === -1 || menus[openIndex]?.disabled)) {
    setState((s) => ({ ...s, ...ALL_CLOSED }));
  }

  const setOpenAt = useCallback(
    (value: string, index: number, open: boolean) => {
      if (open) {
        setState((s) =>
          s.openValue === value ? s : { ...s, openValue: value, focusedValue: value },
        );
        return;
      }
      // Closed in the DOM and focus back before the core reports the choice.
      flushSync(() => setState((s) => (s.openValue === value ? { ...s, openValue: null } : s)));
      focusTrigger(index);
    },
    [focusTrigger],
  );
  const setActiveValue = useCallback((activeValue: string | null) => {
    setState((s) => (s.activeValue === activeValue ? s : { ...s, activeValue }));
  }, []);
  const setOpenPath = useCallback((openPath: string[]) => {
    setState((s) => ({ ...s, openPath }));
  }, []);

  // One connected menu per top menu; only the open one carries the shared
  // focus and open path.
  const apis = useMemo(
    () =>
      menus.map((menu, index) => {
        const open = openIndex === index;
        return core.connect({
          state: {
            open,
            activeValue: open ? state.activeValue : null,
            openPath: open ? state.openPath : [],
            items: menu.items,
            disabled: menu.disabled ?? false,
            id: menuId(index),
          },
          setOpen: (next) => setOpenAt(menu.value, index, next),
          setActiveValue,
          setOpenPath,
          onSelect: onSelect && ((value) => onSelect(menu.value, value)),
          direction: dir,
          normalize: normalizeProps,
        });
      }),
    [menus, openIndex, state, menuId, dir, setOpenAt, setActiveValue, setOpenPath, onSelect],
  );

  const barApi = useMemo(
    () =>
      bar.connect({
        state: {
          menus: menus.map((menu) => ({ value: menu.value, disabled: menu.disabled })),
          focusedIndex,
          openIndex,
        },
        setFocusedIndex: (index) => {
          const focusedValue = menus[index]?.value ?? null;
          setState((s) => (s.focusedValue === focusedValue ? s : { ...s, focusedValue }));
        },
        openMenu: (index) => apis[index]?.openMenu("first"),
        closeMenu: (index) => apis[index]?.closeMenu(),
        focusTrigger,
        direction: dir,
        normalize: normalizeProps,
      }),
    [menus, focusedIndex, openIndex, apis, focusTrigger, dir],
  );

  // Closed without the core's close, which would move focus.
  const dismiss = () => setState((s) => ({ ...s, ...ALL_CLOSED }));

  return (
    <div ref={barRef} className="menubar" aria-label={label} {...barApi.menubarProps}>
      {menus.map((menu, index) => {
        const api = apis[index]!;
        return (
          <div key={menu.value} className="menubar__menu">
            <button
              className="menubar__trigger"
              type="button"
              {...api.triggerProps}
              {...barApi.getTriggerProps(index)}
            >
              {menu.label}
            </button>
            {api.open && host
              ? createPortal(
                  <MenuPopup
                    api={api}
                    prefix="menubar"
                    direction={dir}
                    lang={locale}
                    setOpenPath={setOpenPath}
                    position={(popup) => {
                      const trigger = triggerOf(index);
                      return trigger
                        ? attachFloating(trigger, popup, { sameWidth: true })
                        : () => {};
                    }}
                    inside={() => [triggerOf(index)]}
                    onDismiss={dismiss}
                  />,
                  host,
                )
              : null}
          </div>
        );
      })}
    </div>
  );
}
