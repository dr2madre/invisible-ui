import { navigationBar as core } from "@design-system/core";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { Icon } from "../icon/Icon";
import { cx } from "../internal/cx";
import { hasOpenModal, onModalChange } from "../internal/modal-stack";
import { normalizeProps } from "../normalize";

export type NavigationBadge = core.NavigationBadge;

/** One destination of a Navigation Bar. `icon` is decorative: the label is the name. */
export type NavigationDestination = core.NavigationDestination<ReactNode>;

export interface NavigationBarProps {
  /** The destinations, in reading order. */
  destinations: NavigationDestination[];
  /** The current destination's value. The application owns it. */
  value?: string | null;
  /** Accessible name for the landmark. Defaults to the catalog's "Main". */
  label?: string;
  /** Called with a button destination's value on every activation. */
  onSelect?: (value: string) => void;
  /** Replaces the lock glyph that marks an unavailable destination. */
  unavailableIcon?: ReactNode;
}

/** The badges as the announcements compare them, detached from the props. */
const snapshot = (destinations: NavigationDestination[]): core.NavigationTarget[] =>
  destinations.map(({ value, label, badge }) => ({ value, label, badge: badge && { ...badge } }));

const lock = (
  <Icon>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);

/**
 * NavigationBar: primary navigation between a few top-level sections, ported
 * from the Svelte adapter. A `<nav>` landmark around a list of destinations,
 * each an icon above a visible label. A destination with an `href` is a link
 * the browser or the router follows; one without is a button that reports
 * `onSelect(value)`, again when it is already current. The current
 * destination is the application's `value`, marked with `aria-current="page"`,
 * a shape behind the icon and a heavier label.
 *
 * Every destination is a tab stop; the left and right arrows move between
 * them as well, mirrored under right to left, without wrapping. An
 * unavailable destination stays focusable with its reason read as its
 * description. A badge's text is part of the name, and a badge that appears
 * or changes is announced politely once (`announce: false` silences it);
 * while a modal dialog is open the announcement waits for it to close
 * (ADR 0016).
 *
 * The component reads no screen size. Themeable via `--ds-navigation-bar-*`.
 */
export function NavigationBar({
  destinations,
  value = null,
  label,
  onSelect,
  unavailableIcon,
}: NavigationBarProps) {
  const { t } = useI18n();
  const id = `ds-navigation-bar-${useId()}`;
  const api = core.connect({
    destinations,
    value,
    label: label ?? t("navigationBar.label"),
    id,
    onSelect,
    normalize: normalizeProps,
  });

  // The badges as they were last seen, and the announcements waiting for the
  // last modal dialog to close.
  const seen = useRef<core.NavigationTarget[] | null>(null);
  const held = useRef<core.BadgeAnnouncement[]>([]);
  const [spoken, setSpoken] = useState<core.BadgeAnnouncement[]>([]);

  // A badge that appears or changes is announced once; nothing on mount.
  useEffect(() => {
    const next = snapshot(destinations);
    const announcements = core.badgeAnnouncements(seen.current, next, { translate: t });
    seen.current = next;
    if (announcements.length === 0) return;
    if (hasOpenModal(document)) held.current = core.holdAnnouncements(held.current, announcements);
    else setSpoken(announcements);
  }, [destinations, t]);

  useEffect(
    () =>
      onModalChange(document, () => {
        if (held.current.length === 0 || hasOpenModal(document)) return;
        setSpoken(held.current);
        held.current = [];
      }),
    [],
  );

  return (
    <nav className="navigation-bar" {...api.getRootProps()}>
      <ul className="navigation-bar__list" {...api.getListProps()}>
        {destinations.map((destination) => {
          const { badge, unavailable } = destination;
          const Element = destination.href === undefined ? "button" : "a";
          return (
            <li key={destination.value} className="navigation-bar__item">
              <Element
                className="navigation-bar__destination"
                {...api.getDestinationProps(destination.value)}
              >
                <span className="navigation-bar__indicator" aria-hidden="true">
                  <span className="navigation-bar__icon">{destination.icon}</span>
                  {badge ? (
                    <span
                      className={cx(
                        "navigation-bar__badge",
                        badge.content === undefined && "navigation-bar__badge--dot",
                      )}
                    >
                      {badge.content ?? ""}
                    </span>
                  ) : null}
                  {unavailable ? (
                    <span className="navigation-bar__status">{unavailableIcon ?? lock}</span>
                  ) : null}
                </span>
                <span className="navigation-bar__label" data-label={destination.label}>
                  <span className="navigation-bar__label-text">
                    {destination.label}
                    {badge ? <span className="navigation-bar__hidden">, {badge.label}</span> : null}
                  </span>
                </span>
              </Element>
              {unavailable ? (
                <span className="navigation-bar__reason" {...api.getReasonProps(destination.value)}>
                  {unavailable.reason}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="navigation-bar__live" aria-live="polite">
        {spoken.map((announcement) => (
          <span key={announcement.value}>{announcement.text}</span>
        ))}
      </div>
    </nav>
  );
}
