/**
 * The toggle group's keyboard rule as plain functions: where the tab stop is
 * and where a key sends focus. `manage` in `./dom` applies it to the page.
 */
import { nextIndex, type ToolbarDirection, type ToolbarOrientation } from "../toolbar";

/** The fewest toggles that make the group one tab stop. */
export const ROVING_MINIMUM = 3;

/** Whether the group is one tab stop with arrow keys. */
export function roves({ count, inToolbar }: { count: number; inToolbar: boolean }): boolean {
  return !inToolbar && count >= ROVING_MINIMUM;
}

/**
 * The index, among all toggles, that holds the tab stop: the focused toggle,
 * else the one focused last while it is still enabled, else the first enabled
 * one. `-1` when every toggle is disabled.
 */
export function tabStop({
  disabled,
  focused = -1,
  last = -1,
}: {
  /** One entry per toggle, in order: whether it is disabled. */
  disabled: boolean[];
  /** Index of the toggle that has focus, or `-1`. */
  focused?: number;
  /** Index of the toggle that had focus last, or `-1`. */
  last?: number;
}): number {
  const enabled = (index: number) => index >= 0 && disabled[index] === false;
  if (enabled(focused)) return focused;
  if (enabled(last)) return last;
  return disabled.indexOf(false);
}

/**
 * The index, among all toggles, a key moves focus to, or `null` when the key
 * is not one the group handles. Disabled toggles are skipped.
 */
export function move({
  key,
  index,
  disabled,
  orientation = "horizontal",
  direction = "ltr",
}: {
  key: string;
  /** Index of the focused toggle among all toggles. */
  index: number;
  /** One entry per toggle, in order: whether it is disabled. */
  disabled: boolean[];
  orientation?: ToolbarOrientation;
  direction?: ToolbarDirection;
}): number | null {
  const enabled: number[] = [];
  disabled.forEach((off, i) => {
    if (!off) enabled.push(i);
  });
  const next = nextIndex({
    key,
    index: enabled.indexOf(index),
    count: enabled.length,
    orientation,
    direction,
  });
  return next === null ? null : enabled[next]!;
}

/**
 * Where focus goes when the focused toggle was removed: the toggle now at
 * its place, or the last one. `-1` when no toggle is left.
 */
export function refocusIndex({ lastIndex, count }: { lastIndex: number; count: number }): number {
  return count === 0 ? -1 : Math.min(Math.max(lastIndex, 0), count - 1);
}
