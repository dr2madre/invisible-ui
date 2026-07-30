/**
 * Shared, framework-agnostic types for the design system core.
 *
 * The core never imports a framework. Components expose their behaviour as a
 * pure state plus a `connect()` function that returns *prop getters* — plain,
 * DOM-shaped objects carrying ARIA attributes, `data-*` styling hooks and
 * event handlers. Each framework adapter supplies a {@link Normalize} function
 * that maps these generic prop bags into framework-native props. This is what
 * lets a single behaviour back many frameworks.
 */

/** A plain, framework-agnostic bag of element props produced by `connect()`. */
export interface ElementProps {
  [key: string]: unknown;
}

/**
 * Maps a generic prop bag into framework-native props. Adapters that apply
 * props to the DOM directly (e.g. via a Svelte action) can use the identity
 * normalize; adapters that hand props to a renderer (e.g. React) remap keys.
 */
export type Normalize = <T extends ElementProps>(props: T) => T;

/** Default normalize: returns props unchanged. */
export const identityNormalize: Normalize = (props) => props;

/**
 * Live DOM **properties** to assign to an element, for the cases HTML has no
 * attribute for.
 *
 * `connect()`'s prop bags can only carry *attributes* — things expressible in
 * markup. A few pieces of element state exist only as JavaScript properties:
 * the canonical one is `input.indeterminate`, which has no `indeterminate`
 * attribute at all, so no adapter can render it declaratively.
 *
 * Rather than leave each adapter to remember that per component (a silent bug
 * when forgotten — the control looks right and simply never shows the state),
 * a component declares those here and every adapter applies them the same
 * mechanical way: assign each entry onto the node, reassign when it changes.
 *
 * **Not for properties that already have a working attribute or that the
 * frameworks bind natively** — `checked`, `value` and `disabled` stay in
 * `rootProps`, where the renderer's own controlled-input handling owns them.
 * Assigning those imperatively fights the framework instead of helping it.
 */
export interface DomProps {
  [property: string]: unknown;
}
