import { menu as core } from "@design-system/core";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/i18n";
import { pointAnchor, positionFloating } from "../internal/floating";
import { MenuPopup, useMenu } from "../internal/menu";
import { usePortalHost } from "../internal/portal-host";
import type { MenuEntry } from "../dropdown-menu/DropdownMenu";

export interface ContextMenuProps {
  /** Items, separators, groups and submenus, in the order shown. */
  items: MenuEntry[];
  disabled?: boolean;
  /** Called with the chosen item's value, after every level has closed. */
  onSelect?: (value: string) => void;
  /** Accessible name for the menu, which has no trigger to name it. Defaults to the catalog's "Context menu". */
  label?: string;
  /** The region the menu opens on. */
  children?: ReactNode;
}

const LONG_PRESS = 500;
const MOVE_TOLERANCE = 10;

/**
 * ContextMenu: a styled menu summoned on a region by a right click, the
 * keyboard menu key or Shift+F10, or a long press on touch (500 ms, 10 px
 * tolerance), opening a `role="menu"` at the pointer. Behaviour and
 * accessibility come from the headless menu (`@design-system/core`), with the
 * groups, separators, checkable items and submenus Dropdown Menu has
 * (`docs/menu-submenu-spec.md`). The popup is positioned against the point
 * with Floating UI, and closes when the page scrolls under it. Closing by a
 * key or an activation returns focus to the element focused before opening.
 *
 * Wrap the region in `children`. Themeable via the shared `--ds-menu-*`.
 */
export function ContextMenu({
  items,
  disabled = false,
  onSelect,
  label,
  children,
}: ContextMenuProps) {
  const { t, locale, dir } = useI18n();
  const regionRef = useRef<HTMLDivElement>(null);
  const host = usePortalHost(regionRef);
  // The point the menu opens at, the popup it positions, and the element that
  // had focus before it opened.
  const point = useRef({ x: 0, y: 0 });
  const popupEl = useRef<HTMLElement | null>(null);
  const [previous, setPrevious] = useState<HTMLElement | null>(null);
  const press = useRef<{ timer?: ReturnType<typeof setTimeout>; x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const { api, setOpenPath, dismiss } = useMenu({
    items,
    disabled,
    onSelect,
    direction: dir,
    returnFocus: useCallback(() => {
      if (previous?.isConnected) previous.focus();
    }, [previous]),
  });

  const reposition = () => {
    const popup = popupEl.current;
    const { x, y } = point.current;
    if (popup) positionFloating(pointAnchor(x, y), popup, { placement: "right-start", offset: 2 });
  };

  /** Open, or summon again, at a viewport point, focusing the first item. */
  const openAt = (x: number, y: number) => {
    if (disabled) return;
    point.current = { x, y };
    if (api.open) {
      const first = core.itemsOf(items).find((stop) => !core.isStopDisabled(stop));
      setOpenPath([]);
      if (first) api.setActive(first.value);
      reposition();
      return;
    }
    setPrevious(document.activeElement as HTMLElement | null);
    api.openMenu("first");
  };

  const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    // The keyboard menu key and Shift+F10 carry no pointer: open at the corner.
    if (event.clientX === 0 && event.clientY === 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      openAt(rect.left, rect.top);
    } else {
      openAt(event.clientX, event.clientY);
    }
  };

  const cancelPress = () => clearTimeout(press.current.timer);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    const { clientX: x, clientY: y } = event;
    cancelPress();
    press.current = { x, y, timer: setTimeout(() => openAt(x, y), LONG_PRESS) };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (
      Math.abs(event.clientX - press.current.x) > MOVE_TOLERANCE ||
      Math.abs(event.clientY - press.current.y) > MOVE_TOLERANCE
    )
      cancelPress();
  };
  useEffect(() => () => clearTimeout(press.current.timer), []);

  return (
    <>
      <div
        ref={regionRef}
        className="context-menu__trigger"
        tabIndex={0}
        onContextMenu={onContextMenu}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
      >
        {children}
      </div>

      {api.open && host
        ? createPortal(
            <MenuPopup
              api={api}
              prefix="context-menu"
              direction={dir}
              lang={locale}
              label={label ?? t("contextMenu.label")}
              setOpenPath={setOpenPath}
              position={(popup) => {
                popupEl.current = popup;
                reposition();
                // The anchor is a point in the viewport: once the page scrolls
                // under it the point means nothing, so the menu closes.
                // Scrolling inside the menu is fine.
                const onScroll = (event: Event) => {
                  if (!(event.target instanceof Node && popup.contains(event.target))) {
                    api.closeMenu();
                  }
                };
                window.addEventListener("scroll", onScroll, true);
                return () => {
                  window.removeEventListener("scroll", onScroll, true);
                  if (popupEl.current === popup) popupEl.current = null;
                };
              }}
              onDismiss={dismiss}
            />,
            host,
          )
        : null}
    </>
  );
}
