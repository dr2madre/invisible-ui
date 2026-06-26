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
