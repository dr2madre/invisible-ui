import type { DomProps, ElementProps } from "@design-system/core";

/**
 * The elements adapter's seam over the core's prop bags.
 *
 * The other adapters hand props to a renderer; here there is no renderer —
 * the element IS the DOM — so the seam applies a bag imperatively:
 * `onX` keys become listeners (`onClick` → `click`), booleans toggle
 * attributes, everything else is set as an attribute. `applyProps` may be
 * called again on state changes: listeners are bookkept and replaced, and an
 * `undefined` value removes the attribute (matching how the renderers omit
 * it).
 */
const LISTENERS = new WeakMap<Element, Map<string, EventListener>>();

export function applyProps(el: Element, props: ElementProps): void {
  for (const [key, value] of Object.entries(props)) {
    if (/^on[A-Z]/.test(key)) {
      const type = key.slice(2).toLowerCase();
      const registry = LISTENERS.get(el) ?? new Map<string, EventListener>();
      LISTENERS.set(el, registry);
      const previous = registry.get(type);
      if (previous) el.removeEventListener(type, previous);
      if (typeof value === "function") {
        const listener = value as EventListener;
        el.addEventListener(type, listener);
        registry.set(type, listener);
      } else {
        registry.delete(type);
      }
      continue;
    }

    // ARIA booleans are tokens, not boolean attributes: aria-modal="" is
    // invalid — serialise true/false (the same coercion the Svelte seam does).
    if (key.startsWith("aria-") && typeof value === "boolean") {
      el.setAttribute(key, String(value));
    } else if (value === undefined || value === null || value === false) {
      el.removeAttribute(key);
    } else if (value === true) {
      el.setAttribute(key, "");
    } else {
      el.setAttribute(key, String(value));
    }
  }
}

/** Assign the core's declared DOM-only properties (see `DomProps`). */
export function applyDomProps(el: Element, props: DomProps): void {
  for (const [key, value] of Object.entries(props)) {
    (el as unknown as Record<string, unknown>)[key] = value;
  }
}

/** Dispatch a bubbling CustomEvent (the elements' change/notify contract). */
export function emit<T>(el: HTMLElement, type: string, detail?: T): void {
  el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
}

/** Read a boolean attribute (present = true, `"false"` = false). */
export function boolAttr(el: Element, name: string, fallback = false): boolean {
  if (!el.hasAttribute(name)) return fallback;
  return el.getAttribute(name) !== "false";
}

/**
 * A property set before the element upgraded is stranded on the instance,
 * shadowing the class accessor. Standard custom-element boilerplate: delete
 * and re-assign so the accessor sees it.
 */
export function upgradeProperty(el: HTMLElement, prop: string): void {
  if (Object.prototype.hasOwnProperty.call(el, prop)) {
    const value = (el as unknown as Record<string, unknown>)[prop];
    delete (el as unknown as Record<string, unknown>)[prop];
    (el as unknown as Record<string, unknown>)[prop] = value;
  }
}

/** Build an element from a template literal (light-DOM rendering helper). */
export function fragment(html: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
}

let uid = 0;
/** Unique id for wiring labels and descriptions inside one element. */
export const nextId = (prefix: string) => `${prefix}-${++uid}`;
