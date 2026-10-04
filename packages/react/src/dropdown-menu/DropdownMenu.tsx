import type { menu as core } from "@design-system/core";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronGlyph, Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { attachFloating, ignoreGhostClicks } from "../internal/floating";
import { MenuPopup, useMenu } from "../internal/menu";
import { usePortalHost } from "../internal/portal-host";

export type MenuEntry = core.MenuEntry;
export type MenuItem = core.MenuItem;
export type MenuGroup = core.MenuGroup;
export type MenuSeparator = core.MenuSeparator;
export type MenuSubmenu = core.MenuSubmenu;

export interface DropdownMenuProps {
  /** Visible text of the trigger, and the menu's accessible name. */
  label: string;
  /** Items, separators, groups and submenus, in the order shown. */
  items: MenuEntry[];
  disabled?: boolean;
  /** Called with the chosen item's value, after every level has closed. */
  onSelect?: (value: string) => void;
}

/**
 * DropdownMenu: the styled menu button (WAI-ARIA menu button pattern). A
 * trigger opens a `role="menu"` of items; behaviour and accessibility (arrow,
 * Home and End navigation, typeahead, Escape, Tab and outside press to close,
 * focus moving into the menu and back to the trigger) come from the headless
 * menu (`@design-system/core`). Positioning uses Floating UI.
 *
 * `items` holds actions, checkable items (`kind: "checkbox" | "radio"` with
 * `checked`), separators, groups and submenus (`{ type: "submenu", value,
 * label, items }`), as `docs/menu-submenu-spec.md` describes: a submenu opens
 * by Enter, Space, the arrow toward the inline end, a press or a 100 ms hover,
 * and a grace area keeps it open while the pointer travels to it. Space on a
 * checkable item reports it and keeps the menu open. Themeable via
 * `--ds-menu-*`.
 */
export function DropdownMenu({ label, items, disabled = false, onSelect }: DropdownMenuProps) {
  const { locale, dir } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const host = usePortalHost(rootRef);
  const { api, setOpenPath, dismiss } = useMenu({
    items,
    disabled,
    onSelect,
    direction: dir,
  });

  // Drop iOS's synthesized duplicate click, so the menu does not toggle twice.
  useEffect(() => {
    const node = triggerRef.current;
    return node ? ignoreGhostClicks(node) : undefined;
  }, []);

  return (
    <div className="menu" ref={rootRef}>
      <button className="menu__trigger" type="button" ref={triggerRef} {...api.triggerProps}>
        <span>{label}</span>
        <span className="menu__chevron" aria-hidden="true">
          <Icon size="100%">
            <ChevronGlyph />
          </Icon>
        </span>
      </button>

      {api.open && host
        ? createPortal(
            <MenuPopup
              api={api}
              prefix="menu"
              direction={dir}
              lang={locale}
              setOpenPath={setOpenPath}
              position={(popup) =>
                triggerRef.current
                  ? attachFloating(triggerRef.current, popup, { sameWidth: true })
                  : () => {}
              }
              inside={() => [triggerRef.current]}
              onDismiss={dismiss}
            />,
            host,
          )
        : null}
    </div>
  );
}
