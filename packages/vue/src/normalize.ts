import type { ElementProps, Normalize } from "@design-system/core";

/**
 * The Vue seam: map the core's generic prop bag onto `h()` vnode props.
 *
 * Attributes keep their DOM spelling (`tabindex`, `class`, `for`), which Vue's
 * renderer accepts as-is, so the seam passes them through and only drops
 * `undefined` values, keeping the vnode props clean and the diffing
 * predictable.
 *
 * Event handlers need one rename. Vue derives the DOM event name from the
 * handler key by hyphenating what follows `on`, so a multi-word key such as
 * `onKeyDown` would register a listener for `key-down`. Collapsing the key to a
 * single capitalized word (`onKeydown`, `onMousedown`) makes Vue resolve
 * `keydown` and `mousedown`, the DOM names the core intends. Single-word keys
 * (`onClick`, `onChange`, `onInput`) are already in that shape and come out
 * unchanged.
 */

/** Matches a handler key: `on` followed by a capital letter. */
const HANDLER_KEY = /^on([A-Z])(.*)$/;

export const normalizeProps: Normalize = <T extends ElementProps>(props: T): T => {
  const out: ElementProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    const handler = HANDLER_KEY.exec(key);
    out[handler ? `on${handler[1]}${(handler[2] ?? "").toLowerCase()}` : key] = value;
  }

  return out as T;
};
