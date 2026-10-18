import { useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronGlyph, Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { useAnchorDirection, usePortalHost } from "../internal/portal-host";
import { useNavigationMenu } from "./use-navigation-menu";

/** A link inside a navigation menu panel. */
export interface NavigationMenuLink {
  label: string;
  href: string;
  description?: string;
  /** Whether the link leads to the page on screen. */
  current?: boolean;
}

/** A top-level item: a plain link (`href`), or a panel item that reveals `links`. */
export interface NavigationMenuItem {
  value: string;
  label: string;
  /** For a plain link item. */
  href?: string;
  /** For a plain link item: whether it leads to the page on screen. */
  current?: boolean;
  /** For a panel item: the links revealed when it opens. */
  links?: NavigationMenuLink[];
}

export interface NavigationMenuProps {
  /** Accessible name for the navigation landmark. */
  label: string;
  items: NavigationMenuItem[];
  /** The open item's value, or `null`; initial / controlled. */
  value?: string | null;
  /** Called whenever the user opens, switches or closes a panel. */
  onValueChange?: (value: string | null) => void;
}

/**
 * NavigationMenu: a site-navigation bar where some items reveal a panel of
 * links. Plain items are ordinary links; panel items are disclosures. State
 * and ARIA (`aria-expanded`, `aria-controls`, Escape, ArrowDown) come from the
 * headless navigation menu (`@invisible-ui/core`); the adapter adds hover
 * opening with switching, Floating UI positioning, outside-press dismissal
 * and focus movement (ArrowDown into the panel, Escape back to the trigger).
 * Inside an open dialog the panels render in the dialog (ADR 0016).
 *
 * Hovering a trigger opens its panel while the pointer stays; a click keeps
 * it open, and a second click closes it. Activating a link closes the panel.
 * Mark the link to the page on screen with `current`: it gets
 * `aria-current="page"`, and the trigger whose panel holds it is marked
 * visually only.
 *
 * Themeable via `--ds-navmenu-*`.
 */
export function NavigationMenu({ label, items, value = null, onValueChange }: NavigationMenuProps) {
  const { locale, dir } = useI18n();
  const navRef = useRef<HTMLElement>(null);
  const host = usePortalHost(navRef);
  const popupDir = useAnchorDirection(navRef, dir);
  const nav = useNavigationMenu({ value, onValueChange });

  return (
    <nav ref={navRef} className="navmenu" aria-label={label}>
      <ul className="navmenu__list">
        {items.map((item) => (
          <li key={item.value} className="navmenu__item">
            {item.links ? (
              <>
                <button
                  className="navmenu__trigger"
                  type="button"
                  {...nav.getTriggerProps(item.value, {
                    holdsCurrent: item.links.some((link) => link.current),
                  })}
                >
                  {item.label}
                  <span className="navmenu__chevron" aria-hidden="true">
                    <Icon size="100%">
                      <ChevronGlyph />
                    </Icon>
                  </span>
                </button>
                {nav.value === item.value && host
                  ? createPortal(
                      <div
                        className="navmenu__content"
                        lang={locale}
                        dir={popupDir}
                        {...nav.getContentProps(item.value)}
                        ref={nav.contentRef}
                      >
                        <ul className="navmenu__links">
                          {item.links.map((link) => (
                            <li key={link.href}>
                              <a
                                className="navmenu__link"
                                href={link.href}
                                {...nav.getLinkProps({ current: link.current, item: item.value })}
                              >
                                <span className="navmenu__link-label">{link.label}</span>
                                {link.description ? (
                                  <span className="navmenu__link-desc">{link.description}</span>
                                ) : null}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>,
                      host,
                    )
                  : null}
              </>
            ) : (
              <a
                className="navmenu__toplink"
                href={item.href}
                {...nav.getLinkProps({ current: item.current })}
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
