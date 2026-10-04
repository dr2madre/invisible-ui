import { useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronGlyph, Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { usePortalHost } from "../internal/portal-host";
import { useNavigationMenu } from "./use-navigation-menu";

/** A link inside a navigation menu panel. */
export interface NavigationMenuLink {
  label: string;
  href: string;
  description?: string;
}

/** A top-level item: a plain link (`href`), or a panel item that reveals `links`. */
export interface NavigationMenuItem {
  value: string;
  label: string;
  /** For a plain link item. */
  href?: string;
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
 * headless navigation menu (`@design-system/core`); the adapter adds hover
 * opening with switching, Floating UI positioning, outside-press dismissal
 * and focus movement (ArrowDown into the panel, Escape back to the trigger).
 * Inside an open dialog the panels render in the dialog (ADR 0016).
 *
 * Themeable via `--ds-navmenu-*`.
 */
export function NavigationMenu({ label, items, value = null, onValueChange }: NavigationMenuProps) {
  const { locale, dir } = useI18n();
  const navRef = useRef<HTMLElement>(null);
  const host = usePortalHost(navRef);
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
                  {...nav.getTriggerProps(item.value)}
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
                        dir={dir}
                        {...nav.getContentProps(item.value)}
                        ref={nav.contentRef}
                      >
                        <ul className="navmenu__links">
                          {item.links.map((link) => (
                            <li key={link.href}>
                              <a className="navmenu__link" href={link.href}>
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
              <a className="navmenu__toplink" href={item.href}>
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
