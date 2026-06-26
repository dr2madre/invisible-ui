import type { ElementProps } from "@design-system/core";
import type { Action } from "svelte/action";
import { get, type Readable } from "svelte/store";

/** Anything exposing a `rootProps` bag can be driven by {@link createRootAction}. */
export interface Connectable {
  rootProps: ElementProps;
}

const EVENT_PROP = /^on[A-Z]/;

/** Apply a framework-agnostic prop bag to a DOM node (attributes only). */
export function applyProps(node: HTMLElement, props: ElementProps): void {
  for (const [key, value] of Object.entries(props)) {
    // Event handlers (onClick, onKeyDown, …) are wired separately.
    if (EVENT_PROP.test(key) || typeof value === "function") continue;

    if (value == null) {
      node.removeAttribute(key);
      continue;
    }

    if (typeof value === "boolean") {
      // ARIA boolean attributes must be serialised as "true" / "false".
      if (key.startsWith("aria-")) {
        node.setAttribute(key, value ? "true" : "false");
      } else if (value) {
        node.setAttribute(key, "");
      } else {
        node.removeAttribute(key);
      }
      continue;
    }

    node.setAttribute(key, String(value));
  }
}

/**
 * Build a Svelte action that keeps a node's attributes and event listeners in
 * sync with a prop bag selected from a connected API. Event handlers are
 * dispatched to the latest props, so they always see current state. Used both
 * for a component root and for individual items of a composite component.
 */
export function createPropsAction<T>(
  api: Readable<T>,
  select: (api: T) => ElementProps,
): Action<HTMLElement> {
  return (node) => {
    let current = select(get(api));

    const listeners: Array<[string, EventListener]> = [];
    for (const key of Object.keys(current)) {
      if (!EVENT_PROP.test(key)) continue;
      const eventName = key.slice(2).toLowerCase(); // onClick -> click
      const listener: EventListener = (event) => {
        const handler = current[key];
        if (typeof handler === "function") (handler as (e: Event) => void)(event);
      };
      node.addEventListener(eventName, listener);
      listeners.push([eventName, listener]);
    }

    const unsubscribe = api.subscribe(($api) => {
      current = select($api);
      applyProps(node, current);
    });

    return {
      destroy() {
        unsubscribe();
        for (const [name, listener] of listeners) {
          node.removeEventListener(name, listener);
        }
      },
    };
  };
}

/**
 * Action that drives a node from a connected API's `rootProps`.
 */
export function createRootAction<T extends Connectable>(api: Readable<T>): Action<HTMLElement> {
  return createPropsAction(api, (a) => a.rootProps);
}
