/**
 * The text a navigation bar composes from the message catalog: the name a
 * platform without `aria-current` and list positions reads (the Flutter
 * adapter), and the polite badge announcements every adapter makes.
 */
import { DEFAULT_LOCALE } from "../i18n/locale";
import { en, type MessageKey, type Messages } from "../i18n/messages";
import { translate } from "../i18n/translate";
import type { BadgeAnnouncement, NavigationTarget } from "./types";

export interface TextOptions {
  /** Resolved locale, for plural rules. Defaults to the catalog's. */
  locale?: string;
  /** Consumer catalog overrides. */
  messages?: Messages;
  /**
   * An adapter's own translator, already bound to its locale and overrides.
   * Given, it wins over `locale` and `messages`.
   */
  translate?: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

export interface DescribeOptions extends TextOptions {
  /** Position among the destinations passed, from 1. Given with `count`, the position is read. */
  index?: number;
  /** How many destinations the bar shows. */
  count?: number;
  /** Whether this destination is the current one; read as `navigationBar.current`. */
  current?: boolean;
}

const t = (options: TextOptions, key: MessageKey, vars?: Record<string, string | number>) =>
  options.translate
    ? options.translate(key, vars)
    : translate(en, options.messages ?? {}, options.locale ?? DEFAULT_LOCALE, key, vars);

/**
 * The destination's spoken name: its label, then the badge text, then the
 * position ("Tab 4 of 5") when `index` and `count` are given, then the current
 * marker when `current` is true. The parts are joined with ", ", so the order
 * lives here and nowhere else. The unavailable reason is not part of the name:
 * it is the destination's description.
 */
export function describeDestination(
  destination: NavigationTarget,
  options: DescribeOptions = {},
): string {
  const parts = [destination.label];
  if (destination.badge?.label) parts.push(destination.badge.label);
  if (options.index !== undefined && options.count !== undefined) {
    parts.push(
      t(options, "navigationBar.position", { index: options.index, count: options.count }),
    );
  }
  if (options.current) parts.push(t(options, "navigationBar.current"));
  return parts.join(", ");
}

/**
 * The badge changes to announce between two renders, in the order of `next`:
 * a badge whose `label` appeared or changed, unless it sets `announce: false`.
 * Nothing on first render (`previous` is `null`) and nothing when a badge goes
 * away. A destination is matched by `value`; one that was not passed before
 * counts as having no badge.
 */
export function badgeAnnouncements(
  previous: readonly NavigationTarget[] | null,
  next: readonly NavigationTarget[],
  options: TextOptions = {},
): BadgeAnnouncement[] {
  if (previous === null) return [];
  const before = new Map(previous.map((destination) => [destination.value, destination]));
  const out: BadgeAnnouncement[] = [];
  for (const destination of next) {
    const badge = destination.badge;
    if (!badge?.label || badge.announce === false) continue;
    if (before.get(destination.value)?.badge?.label === badge.label) continue;
    out.push({
      value: destination.value,
      text: t(options, "navigationBar.announcement", {
        label: destination.label,
        badge: badge.label,
      }),
    });
  }
  return out;
}

/**
 * Announcements waiting for the last modal dialog to close (ADR 0016, case
 * 2): only the latest one per destination is kept, in the order each
 * destination first waited.
 */
export function holdAnnouncements(
  held: readonly BadgeAnnouncement[],
  incoming: readonly BadgeAnnouncement[],
): BadgeAnnouncement[] {
  const latest = new Map(held.map((entry) => [entry.value, entry]));
  for (const entry of incoming) latest.set(entry.value, entry);
  return [...latest.values()];
}

/** The badges between renders and the announcements held behind a modal. */
export interface BadgeAnnouncer {
  /**
   * Compare `destinations` with the previous call and return what to announce
   * now. The first call only records them. While `isModalOpen()` is true the
   * announcements are held and nothing is returned; it is asked only when
   * there is something to announce.
   */
  update(
    destinations: readonly NavigationTarget[],
    isModalOpen: () => boolean,
    options?: TextOptions,
  ): BadgeAnnouncement[];
  /** After a modal closes: the held announcements, once no modal is open. */
  release(isModalOpen: boolean): BadgeAnnouncement[];
  /** Forget the recorded badges: the next `update` is a first render again. */
  reset(): void;
}

/**
 * The badge announcements of one navigation, Navigation Bar or Sidebar: a
 * badge that appears or changes is announced once, politely, never on first
 * render, and while a modal dialog is open the latest one per destination
 * waits for it to close (ADR 0016, case 2). The adapters own the live region
 * and the modal tracking.
 */
export function createBadgeAnnouncer(): BadgeAnnouncer {
  let seen: NavigationTarget[] | null = null;
  let held: BadgeAnnouncement[] = [];
  return {
    update(destinations, isModalOpen, options = {}) {
      // A copy: the next call compares with what was shown, not with an
      // object the application has since changed in place.
      const next = destinations.map(({ value, label, badge }) => ({
        value,
        label,
        badge: badge && { ...badge },
      }));
      const announcements = badgeAnnouncements(seen, next, options);
      seen = next;
      if (announcements.length === 0) return [];
      if (!isModalOpen()) return announcements;
      held = holdAnnouncements(held, announcements);
      return [];
    },
    release(isModalOpen) {
      if (isModalOpen || held.length === 0) return [];
      const out = held;
      held = [];
      return out;
    },
    reset() {
      seen = null;
    },
  };
}
