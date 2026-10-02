import type { ElementProps } from "@design-system/core";
import type { Action } from "svelte/action";
import { get, type Readable } from "svelte/store";

/** Anything exposing a `rootProps` bag can be driven by {@link createRootAction}. */
export interface Connectable {
  rootProps: ElementProps;
}

const EVENT_PROP = /^on[A-Z]/;

/** Apply a framework-agnostic prop bag to a DOM node (attributes only). */
export function applyProps(node: Element, props: ElementProps): void {
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

interface PropsBinding<T> {
  /** Switch to a new selector and apply the props it returns. */
  reselect(select: (api: T) => ElementProps): void;
  destroy(): void;
}

/**
 * Keep a node's attributes and event listeners in sync with a prop bag
 * selected from a connected API. Event handlers are dispatched to the latest
 * props, so they always see current state.
 */
function bindProps<T>(
  node: Element,
  api: Readable<T>,
  initialSelect: (api: T) => ElementProps,
): PropsBinding<T> {
  let select = initialSelect;
  let current = select(get(api));
  const listeners = new Map<string, EventListener>();

  const listen = () => {
    for (const key of Object.keys(current)) {
      if (!EVENT_PROP.test(key) || listeners.has(key)) continue;
      const listener: EventListener = (event) => {
        const handler = current[key];
        if (typeof handler === "function") (handler as (e: Event) => void)(event);
      };
      node.addEventListener(eventName(key), listener);
      listeners.set(key, listener);
    }
  };
  listen();

  const unsubscribe = api.subscribe(($api) => {
    current = select($api);
    applyProps(node, current);
  });

  return {
    reselect(next) {
      const previous = current;
      select = next;
      current = select(get(api));
      // Drop attributes the old selection set and the new one does not.
      for (const [key, value] of Object.entries(previous)) {
        if (EVENT_PROP.test(key) || typeof value === "function") continue;
        if (!(key in current)) node.removeAttribute(key);
      }
      applyProps(node, current);
      listen();
    },
    destroy() {
      unsubscribe();
      for (const [key, listener] of listeners) {
        node.removeEventListener(eventName(key), listener);
      }
    },
  };
}

/** `onClick` -> `click`. */
function eventName(key: string): string {
  return key.slice(2).toLowerCase();
}

/**
 * Build a Svelte action that drives a node from a prop bag selected from a
 * connected API, such as a component root or one of its parts.
 */
export function createPropsAction<T, E extends Element = HTMLElement>(
  api: Readable<T>,
  select: (api: T) => ElementProps,
): (node: E) => { destroy(): void } {
  return (node) => {
    const binding = bindProps(node, api, select);
    return { destroy: binding.destroy };
  };
}

/**
 * Build a Svelte action for one item of a composite component, picked by the
 * action parameter (`use:tabAction={value}`). When the parameter changes on
 * the same node, the action applies the props of the new item.
 */
export function createItemAction<T, P, E extends Element = HTMLElement>(
  api: Readable<T>,
  select: (api: T, param: P) => ElementProps,
): (node: E, param: P) => { update(param: P): void; destroy(): void } {
  return (node, param) => {
    const binding = bindProps(node, api, (a) => select(a, param));
    return {
      update(next) {
        binding.reselect((a) => select(a, next));
      },
      destroy: binding.destroy,
    };
  };
}

/**
 * Action that drives a node from a connected API's `rootProps`.
 */
export function createRootAction<T extends Connectable>(api: Readable<T>): Action<HTMLElement> {
  return createPropsAction(api, (a) => a.rootProps);
}
