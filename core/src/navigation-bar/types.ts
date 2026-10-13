/**
 * A navigation bar: primary navigation between a few top-level sections, each
 * destination with an icon and a visible label, one of them current
 * (docs/navigation-bar-spec.md). The current destination is the
 * application's; the bar reports activations and owns no routing state.
 */

/** A notification on a section. */
export interface NavigationBadge {
  /** Visible content: a short count ("3", "99+"). Omitted: a dot glyph. */
  content?: string;
  /** Accessible text: "3 unread", "Needs attention". */
  label: string;
  /** Announce politely when `label` changes. Defaults to `true`. */
  announce?: boolean;
}

/** Why a destination cannot open now. */
export interface NavigationUnavailable {
  /** Read with the destination and shown on hover, focus and long press. */
  reason: string;
}

/**
 * What the headless logic reads of a destination. Adapters add the icon in
 * their own vocabulary (`NavigationDestination`).
 */
export interface NavigationTarget {
  /** Identity, unique in the bar. */
  value: string;
  /** Visible label and accessible name. */
  label: string;
  /** Renders a link. Without it the destination is a button that reports `onSelect`. */
  href?: string;
  /** A notification on the section. */
  badge?: NavigationBadge;
  /** The section cannot open now; the reason is read with the destination. */
  unavailable?: NavigationUnavailable;
}

/** A destination with its decorative icon, hidden from assistive technology. */
export interface NavigationDestination<TIcon = unknown> extends NavigationTarget {
  icon: TIcon;
}

/** One badge change to announce. */
export interface BadgeAnnouncement {
  /** The destination whose badge changed. */
  value: string;
  /** The text to announce: "Profile: Needs attention". */
  text: string;
}
