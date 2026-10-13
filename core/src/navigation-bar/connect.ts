import { DEV } from "../internal/dev";
import { identityNormalize, type ElementProps, type Normalize } from "../types";
import type { NavigationTarget } from "./types";

/** The count the pattern is drawn for; more stop fitting at 320 px and text scale 2.0. */
export const RECOMMENDED_MAXIMUM = 5;

/** The attribute every destination carries, so the keys can find its siblings. */
export const DESTINATION_ATTRIBUTE = "data-navigation-destination";

/**
 * Where an arrow key moves focus among `count` destinations, or `null` when
 * the key is not one the bar handles or focus is already at that end. Left
 * and right follow the reading direction; there is no wrap and no Home or
 * End. Unavailable destinations stay in the order, so their reason can be
 * heard.
 */
export function move({
  key,
  index,
  count,
  direction = "ltr",
}: {
  key: string;
  /** Index of the focused destination. */
  index: number;
  count: number;
  direction?: "ltr" | "rtl";
}): number | null {
  let step: number;
  if (key === "ArrowRight") step = direction === "rtl" ? -1 : 1;
  else if (key === "ArrowLeft") step = direction === "rtl" ? 1 : -1;
  else return null;
  const next = index + step;
  return next >= 0 && next < count ? next : null;
}

const checked = /* @__PURE__ */ new WeakSet<readonly NavigationTarget[]>();
const warnedValues = /* @__PURE__ */ new WeakMap<readonly NavigationTarget[], Set<string>>();

/**
 * Development checks: a repeated value throws, because `onSelect` reports
 * values and ids are built from them; more than five destinations warn, and
 * so does a `value` that names no destination (a `null` value is valid).
 * Production builds skip them; the first destination with a repeated value
 * wins.
 */
export function checkDestinations(
  destinations: readonly NavigationTarget[],
  value: string | null = null,
): void {
  if (!DEV) return;
  if (!checked.has(destinations)) {
    const seen = new Set<string>();
    for (const destination of destinations) {
      if (seen.has(destination.value)) {
        throw new Error(`[ds] Navigation bar value "${destination.value}" appears more than once.`);
      }
      seen.add(destination.value);
    }
    if (destinations.length > RECOMMENDED_MAXIMUM) {
      console.warn(
        `[ds] The navigation bar has ${destinations.length} destinations; ` +
          `up to ${RECOMMENDED_MAXIMUM} fit at 320 px and text scale 2.0.`,
      );
    }
    checked.add(destinations);
  }
  if (value === null || destinations.some((destination) => destination.value === value)) return;
  let warned = warnedValues.get(destinations);
  if (!warned) warnedValues.set(destinations, (warned = new Set()));
  if (warned.has(value)) return;
  warned.add(value);
  console.warn(`[ds] The navigation bar value "${value}" names no destination; none is current.`);
}

/** The public, framework-agnostic API for a connected navigation bar. */
export interface NavigationBarApi {
  /** The current destination's value, or `null` when `value` names none. */
  current: string | null;
  /** Props for the `<nav>` landmark. */
  getRootProps(): ElementProps;
  /** Props for the `<ul>` of destinations. */
  getListProps(): ElementProps;
  /**
   * Props for a destination: `href` for a link or `type="button"`,
   * `aria-current="page"` on the current one, `aria-disabled` and the reason
   * link on an unavailable one, and the handlers.
   */
  getDestinationProps(value: string): ElementProps;
  /** Props for the element that holds an unavailable destination's reason. */
  getReasonProps(value: string): ElementProps;
  /** The arrow keys on a destination: next or previous, mirrored, no wrap. */
  onDestinationKeyDown(event: Event): void;
  /** Activate a destination without an `href`: reports once; nothing when unavailable. */
  select(value: string): void;
}

export interface ConnectOptions {
  destinations: readonly NavigationTarget[];
  /** The current destination's value. The application owns it. */
  value?: string | null;
  /** The landmark's accessible name. */
  label: string;
  /** Base id for the reason elements. */
  id: string;
  /** Called with a button destination's value on every activation. */
  onSelect?: (value: string) => void;
  /** Reading direction. Read from the destination's computed style when left out. */
  direction?: "ltr" | "rtl";
  normalize?: Normalize;
}

/** How long a press rests on an unavailable destination before its reason shows. */
export const LONG_PRESS_MS = 500;

/** The attribute that shows a reason, set by a long press and cleared by Escape. */
const REASON_SHOWN = "data-reason-shown";
const REASON_DISMISSED = "data-reason-dismissed";

const reasonId = (id: string, index: number) => `${id}-reason-${index}`;

// A long press shows an unavailable destination's reason, as hover and focus
// do. The timer is kept per element, outside any one render, so a press that
// spans a re-render is still cancelled.
const timers = /* @__PURE__ */ new WeakMap<EventTarget, ReturnType<typeof setTimeout>>();

/**
 * Connect navigation-bar props following APG landmark navigation: a `<nav>`
 * named by `label` around a list of links, `aria-current="page"` on the
 * current one. Every destination is its own tab stop; the arrow keys are an
 * addition that moves focus only. A destination with `href` is a link the
 * browser or the router follows, and the bar reports nothing; one without is
 * a button that reports `onSelect(value)`, again on the current one. An
 * unavailable destination stays focusable, carries `aria-disabled` and its
 * reason as a description, and activation does nothing.
 */
export function connect({
  destinations,
  value = null,
  label,
  id,
  onSelect,
  direction,
  normalize = identityNormalize,
}: ConnectOptions): NavigationBarApi {
  checkDestinations(destinations, value);
  const indexOf = (v: string) => destinations.findIndex((destination) => destination.value === v);
  const current = value !== null && indexOf(value) !== -1 ? value : null;

  const select = (v: string) => {
    const destination = destinations[indexOf(v)];
    if (!destination || destination.unavailable) return;
    onSelect?.(v);
  };

  const onDestinationKeyDown = (event: Event) => {
    const keyboard = event as KeyboardEvent;
    const target = event.currentTarget as HTMLElement | null;
    if (keyboard.key === "Escape") {
      target?.removeAttribute(REASON_SHOWN);
      target?.setAttribute(REASON_DISMISSED, "");
      return;
    }
    if (!target || keyboard.altKey || keyboard.ctrlKey || keyboard.metaKey) return;
    const list = target.closest("ul, ol, [role='list']");
    if (!list) return;
    const all = Array.from(list.querySelectorAll<HTMLElement>(`[${DESTINATION_ATTRIBUTE}]`));
    const dir =
      direction ??
      (target.ownerDocument.defaultView?.getComputedStyle(target).direction === "rtl"
        ? "rtl"
        : "ltr");
    const next = move({
      key: keyboard.key,
      index: all.indexOf(target),
      count: all.length,
      direction: dir,
    });
    if (next === null) return;
    event.preventDefault();
    all[next]!.focus();
  };

  const cancelPress = (event: Event) => {
    const target = event.currentTarget;
    if (!target) return;
    clearTimeout(timers.get(target));
    timers.delete(target);
  };
  const hideReason = (event: Event) => {
    cancelPress(event);
    const target = event.currentTarget as HTMLElement | null;
    target?.removeAttribute(REASON_SHOWN);
    target?.removeAttribute(REASON_DISMISSED);
  };

  return {
    current,
    getRootProps: () => normalize({ "aria-label": label }),
    // A list styled without bullets loses its role in some browsers; the
    // role keeps "list, 5 items".
    getListProps: () => normalize({ role: "list" }),
    getDestinationProps: (v: string) => {
      const index = indexOf(v);
      const destination = destinations[index];
      const isCurrent = current === v;
      const unavailable = destination?.unavailable !== undefined;
      const href = destination?.href;
      return normalize({
        [DESTINATION_ATTRIBUTE]: "",
        href,
        type: href === undefined ? "button" : undefined,
        "aria-current": isCurrent ? "page" : undefined,
        "aria-disabled": unavailable ? "true" : undefined,
        "aria-describedby": unavailable ? reasonId(id, index) : undefined,
        "data-current": isCurrent ? "" : undefined,
        "data-unavailable": unavailable ? "" : undefined,
        onClick: (event: Event) => {
          if (unavailable) {
            event.preventDefault();
            return;
          }
          if (href === undefined) select(v);
        },
        // A middle click would open an unavailable link in a new tab.
        onAuxClick: unavailable ? (event: Event) => event.preventDefault() : undefined,
        onKeyDown: onDestinationKeyDown,
        onPointerDown: unavailable
          ? (event: Event) => {
              const target = event.currentTarget as HTMLElement;
              clearTimeout(timers.get(target));
              timers.set(
                target,
                setTimeout(() => {
                  target.removeAttribute(REASON_DISMISSED);
                  target.setAttribute(REASON_SHOWN, "");
                }, LONG_PRESS_MS),
              );
            }
          : undefined,
        onPointerUp: unavailable ? cancelPress : undefined,
        onPointerCancel: unavailable ? cancelPress : undefined,
        onPointerLeave: unavailable ? hideReason : undefined,
        onBlur: unavailable ? hideReason : undefined,
        // The long press must not open the platform's context menu or link preview.
        onContextMenu: unavailable ? (event: Event) => event.preventDefault() : undefined,
      });
    },
    getReasonProps: (v: string) => normalize({ id: reasonId(id, indexOf(v)) }),
    onDestinationKeyDown,
    select,
  };
}
