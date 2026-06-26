/**
 * Semantic intent of a button — not a visual style, but *what the action means*
 * in a flow. Adapters expose it as `data-variant` so styling stays in the
 * consumer while the meaning is owned here.
 *
 * - `default`: the baseline, medium-emphasis button (the default).
 * - `primary`: the most important action to move the flow forward.
 * - `secondary`: an alternative emphasized action, on the brand's secondary
 *   color — typically paired next to `primary`.
 * - `ghost`: a reduced-affordance button — looks less like a button (no fill /
 *   border at rest), for low-emphasis or in-context actions.
 * - `danger`: a destructive action; carries the `danger` semantic color and may
 *   pair a hazard icon as a non-color cue.
 */
export type ButtonVariant = "default" | "primary" | "secondary" | "ghost" | "danger";

/** Internal, fully-resolved state of a Button. */
export interface ButtonState {
  disabled: boolean;
  variant: ButtonVariant;
}

/** User-provided options when creating a Button. */
export interface ButtonContext {
  /** Whether the button is disabled. Defaults to `false`. */
  disabled?: boolean;
  /** Semantic variant. Defaults to `"default"`. */
  variant?: ButtonVariant;
}
